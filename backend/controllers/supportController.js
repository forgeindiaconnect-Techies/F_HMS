import Ticket from '../models/Ticket.js';
import TicketReply from '../models/TicketReply.js';
import SupportAgent from '../models/SupportAgent.js';
import KnowledgeBase from '../models/KnowledgeBase.js';
import SupportAnnouncement from '../models/SupportAnnouncement.js';
import TicketActivityLog from '../models/TicketActivityLog.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Setup file upload for ticket attachments
const uploadDir = 'uploads/tickets';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, JPEG, PNG, DOC/DOCX, XLS/XLSX are allowed.'), false);
    }
};

export const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

// Middleware helper to check Enterprise Subscription
export const checkEnterprisePlan = async (restaurantId) => {
    if (!restaurantId) return false;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return false;
    
    // Check plan & status
    const plan = restaurant.subscription?.plan;
    const status = restaurant.subscription?.status;
    return plan === 'Enterprise' && status === 'Active';
};

// Helper: Log Ticket Activity
const logActivity = async (ticketId, action, req, details) => {
    try {
        await TicketActivityLog.create({
            ticketId,
            action,
            performedBy: req.user._id,
            userRole: req.user.role,
            details
        });
    } catch (err) {
        console.error('Failed to log ticket activity:', err.message);
    }
};

// Helper: Auto Assign Ticket to agent with lowest workload
const autoAssignTicket = async (ticket) => {
    try {
        // Find active support agents
        const agents = await SupportAgent.find({ isActive: true }).sort({ workload: 1 });
        if (agents.length > 0) {
            const chosenAgent = agents[0];
            
            ticket.assignedAgentId = chosenAgent.userId;
            ticket.status = 'Assigned';
            await ticket.save();

            // Increment workload
            chosenAgent.workload += 1;
            await chosenAgent.save();

            // Return user details for notifications
            const agentUser = await User.findById(chosenAgent.userId);
            return agentUser;
        }
        return null;
    } catch (error) {
        console.error('Error auto-assigning ticket:', error.message);
        return null;
    }
};

// Helper: Generate Unique Ticket ID
const generateTicketId = async () => {
    let exists = true;
    let ticketId = '';
    while (exists) {
        const rand = Math.floor(100000 + Math.random() * 900000);
        ticketId = `TKT-${rand}`;
        const count = await Ticket.countDocuments({ ticketId });
        if (count === 0) exists = false;
    }
    return ticketId;
};

// @desc    Create a new support ticket
// @route   POST /api/support/tickets
// @access  Private (Enterprise Restaurant Only)
export const createTicket = async (req, res) => {
    try {
        const isEnterprise = await checkEnterprisePlan(req.user.restaurantId);
        if (!isEnterprise && req.user.role !== 'SuperAdmin' && req.user.role !== 'SupportAgent') {
            return res.status(403).json({
                message: '24/7 Customer Care is available only for Enterprise Plan subscribers.'
            });
        }

        const { subject, category, priority, description, branchId } = req.body;
        
        let attachmentPaths = [];
        if (req.files && req.files.length > 0) {
            attachmentPaths = req.files.map(file => `/uploads/tickets/${file.filename}`);
        }

        const tktId = await generateTicketId();

        const ticket = new Ticket({
            ticketId: tktId,
            restaurantId: req.user.restaurantId,
            branchId: branchId || undefined,
            subject,
            category,
            priority: priority || 'Medium',
            description,
            attachments: attachmentPaths,
            status: 'Open'
        });

        await ticket.save();
        
        // Log ticket creation
        await logActivity(ticket._id, 'Created', req, `Ticket created by ${req.user.name} (${req.user.role})`);

        // Send Notification to restaurant
        await Notification.create({
            title: `Ticket Created - ${tktId}`,
            desc: `Your ticket regarding "${subject}" has been successfully created.`,
            type: 'Info',
            restaurantId: req.user.restaurantId
        });

        // Trigger Auto Assignment
        const assignedAgent = await autoAssignTicket(ticket);
        if (assignedAgent) {
            await logActivity(ticket._id, 'Assigned', req, `Ticket auto-assigned to Support Agent ${assignedAgent.name}`);
            
            // Notify restaurant about assigned agent
            await Notification.create({
                title: `Agent Assigned - ${tktId}`,
                desc: `Support Agent "${assignedAgent.name}" has been assigned to help you.`,
                type: 'Info',
                restaurantId: req.user.restaurantId
            });

            // Notify Support Agent
            await Notification.create({
                title: `New Ticket Assigned - ${tktId}`,
                desc: `A new ticket "${subject}" has been assigned to you.`,
                type: 'Alert',
                restaurantId: req.user.restaurantId // Linked to restaurant
            });
        } else {
            // Notify SuperAdmins of unassigned new ticket
            await Notification.create({
                title: `New Support Ticket - ${tktId}`,
                desc: `A new support ticket "${subject}" has been created.`,
                type: 'System'
            });
        }

        // If ticket is Critical, trigger immediate highlights and notify
        if (priority === 'Critical') {
            await Notification.create({
                title: `🚨 Emergency Support Ticket - ${tktId}`,
                desc: `A Critical priority ticket "${subject}" requires immediate attention!`,
                type: 'System'
            });
        }

        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get support tickets (Filtered based on role)
// @route   GET /api/support/tickets
// @access  Private (Enterprise Restaurant or Support Agent/SuperAdmin)
export const getTickets = async (req, res) => {
    try {
        const isSuperAdminOrAgent = req.user.role === 'SuperAdmin' || req.user.role === 'SupportAgent';
        
        if (!isSuperAdminOrAgent) {
            const isEnterprise = await checkEnterprisePlan(req.user.restaurantId);
            if (!isEnterprise) {
                return res.status(403).json({
                    message: '24/7 Customer Care is available only for Enterprise Plan subscribers.'
                });
            }
        }

        let query = {};
        
        if (!isSuperAdminOrAgent) {
            // Restaurant Admin / staff can only see their own restaurant's tickets
            query.restaurantId = req.user.restaurantId;
        } else if (req.user.role === 'SupportAgent') {
            // Support agents see tickets assigned to them, plus open unassigned ones
            query = {
                $or: [
                    { assignedAgentId: req.user._id },
                    { status: 'Open' }
                ]
            };
        }

        // Filters from query params
        if (req.query.status) query.status = req.query.status;
        if (req.query.priority) query.priority = req.query.priority;
        if (req.query.category) query.category = req.query.category;
        
        let search = {};
        if (req.query.search) {
            search = {
                $or: [
                    { subject: { $regex: req.query.search, $options: 'i' } },
                    { ticketId: { $regex: req.query.search, $options: 'i' } }
                ]
            };
        }

        const combinedQuery = { ...query, ...search };

        // Sorting: Critical priority first, then lastUpdated desc
        const tickets = await Ticket.find(combinedQuery)
            .populate('restaurantId', 'name logo')
            .populate('branchId', 'name')
            .populate('assignedAgentId', 'name email')
            .sort({ priority: 1, lastUpdated: -1 });

        // Custom sorting helper for Priority ordering: Critical -> High -> Medium -> Low
        const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        tickets.sort((a, b) => {
            if (a.status === 'Closed' && b.status !== 'Closed') return 1;
            if (b.status === 'Closed' && a.status !== 'Closed') return -1;
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get support ticket by ID
// @route   GET /api/support/tickets/:id
// @access  Private
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('restaurantId', 'name logo subscription')
            .populate('branchId', 'name')
            .populate('assignedAgentId', 'name email');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        const isSuperAdminOrAgent = req.user.role === 'SuperAdmin' || req.user.role === 'SupportAgent';
        if (!isSuperAdminOrAgent) {
            // Check ownership
            if (ticket.restaurantId._id.toString() !== req.user.restaurantId?.toString()) {
                return res.status(403).json({ message: 'Unauthorized access to this ticket.' });
            }
            
            // Check plan
            const isEnterprise = await checkEnterprisePlan(req.user.restaurantId);
            if (!isEnterprise) {
                return res.status(403).json({
                    message: '24/7 Customer Care is available only for Enterprise Plan subscribers.'
                });
            }
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update support ticket details/status
// @route   PUT /api/support/tickets/:id
// @access  Private
export const updateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        const isSuperAdminOrAgent = req.user.role === 'SuperAdmin' || req.user.role === 'SupportAgent';
        if (!isSuperAdminOrAgent && ticket.restaurantId.toString() !== req.user.restaurantId?.toString()) {
            return res.status(403).json({ message: 'Unauthorized access.' });
        }

        const { status, priority, category, assignedAgentId } = req.body;

        const prevStatus = ticket.status;
        const prevAgent = ticket.assignedAgentId;

        if (status) ticket.status = status;
        if (priority) ticket.priority = priority;
        if (category) ticket.category = category;
        
        // Handle Agent manual assignment / reassignment
        if (assignedAgentId !== undefined && assignedAgentId !== String(prevAgent)) {
            // Decrement previous agent workload
            if (prevAgent) {
                await SupportAgent.findOneAndUpdate({ userId: prevAgent }, { $inc: { workload: -1 } });
            }
            
            if (assignedAgentId) {
                ticket.assignedAgentId = assignedAgentId;
                if (ticket.status === 'Open') {
                    ticket.status = 'Assigned';
                }
                // Increment new agent workload
                await SupportAgent.findOneAndUpdate({ userId: assignedAgentId }, { $inc: { workload: 1 } });
                
                const agentUser = await User.findById(assignedAgentId);
                await logActivity(ticket._id, 'Assigned', req, `Ticket assigned to Support Agent ${agentUser?.name || 'Unknown'}`);
            } else {
                ticket.assignedAgentId = undefined;
                ticket.status = 'Open';
                await logActivity(ticket._id, 'Unassigned', req, `Ticket unassigned`);
            }
        }

        // Calculate Resolution Time when Ticket gets resolved or closed
        if ((status === 'Resolved' || status === 'Closed') && prevStatus !== 'Resolved' && prevStatus !== 'Closed') {
            const createdAt = new Date(ticket.createdAt);
            const resolvedAt = new Date();
            const diffMin = Math.round((resolvedAt - createdAt) / (1000 * 60));
            ticket.resolutionTime = diffMin;

            // Decrement Agent Workload
            if (ticket.assignedAgentId) {
                await SupportAgent.findOneAndUpdate(
                    { userId: ticket.assignedAgentId },
                    { 
                        $inc: { workload: -1, totalResolved: 1 },
                        $push: { averageResolutionTime: diffMin } // We can calculate aggregate later
                    }
                );
            }
        }

        await ticket.save();

        if (status && status !== prevStatus) {
            await logActivity(ticket._id, 'StatusUpdated', req, `Ticket status changed from ${prevStatus} to ${status}`);
            
            // Notify Restaurant
            await Notification.create({
                title: `Ticket Status Updated - ${ticket.ticketId}`,
                desc: `Your ticket status has been changed to "${status}".`,
                type: 'Alert',
                restaurantId: ticket.restaurantId
            });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get ticket replies (Conversations)
// @route   GET /api/support/tickets/:id/replies
// @access  Private
export const getTicketReplies = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        const isSuperAdminOrAgent = req.user.role === 'SuperAdmin' || req.user.role === 'SupportAgent';
        if (!isSuperAdminOrAgent && ticket.restaurantId.toString() !== req.user.restaurantId?.toString()) {
            return res.status(403).json({ message: 'Unauthorized access.' });
        }

        let query = { ticketId: req.params.id };
        if (!isSuperAdminOrAgent) {
            // Hide internal notes from restaurant users
            query.isInternalNote = false;
        }

        const replies = await TicketReply.find(query)
            .populate('senderId', 'name email role')
            .sort({ createdAt: 1 });

        res.json(replies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a reply to ticket (Conversation)
// @route   POST /api/support/tickets/:id/replies
// @access  Private
export const addTicketReply = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        const isSuperAdminOrAgent = req.user.role === 'SuperAdmin' || req.user.role === 'SupportAgent';
        if (!isSuperAdminOrAgent && ticket.restaurantId.toString() !== req.user.restaurantId?.toString()) {
            return res.status(403).json({ message: 'Unauthorized access.' });
        }

        const { message, isInternalNote } = req.body;

        let attachmentPaths = [];
        if (req.files && req.files.length > 0) {
            attachmentPaths = req.files.map(file => `/uploads/tickets/${file.filename}`);
        }

        const reply = new TicketReply({
            ticketId: ticket._id,
            senderId: req.user._id,
            message,
            isInternalNote: isSuperAdminOrAgent ? (isInternalNote === 'true' || isInternalNote === true) : false,
            attachments: attachmentPaths,
            readBy: [req.user._id]
        });

        await reply.save();

        // Update Ticket Status depending on who is replying
        const prevStatus = ticket.status;
        if (isSuperAdminOrAgent) {
            if (!reply.isInternalNote) {
                // If support agent replies to customer, set status to Waiting for Customer or In Progress
                ticket.status = 'Waiting for Customer';
            }
        } else {
            // If restaurant owner replies, set status back to In Progress or Open
            if (ticket.status === 'Waiting for Customer' || ticket.status === 'Assigned') {
                ticket.status = 'In Progress';
            } else if (ticket.status === 'Open') {
                ticket.status = 'Open';
            }
        }

        await ticket.save();

        await logActivity(ticket._id, 'ReplyAdded', req, `${reply.isInternalNote ? 'Internal note' : 'Message'} sent by ${req.user.name}`);

        // Notifications
        if (isSuperAdminOrAgent && !reply.isInternalNote) {
            // Notify Restaurant
            await Notification.create({
                title: `New Support Agent Message - ${ticket.ticketId}`,
                desc: `Support Agent "${req.user.name}" has replied to your ticket.`,
                type: 'Alert',
                restaurantId: ticket.restaurantId
            });
        } else if (!isSuperAdminOrAgent) {
            // Notify Support Agent
            if (ticket.assignedAgentId) {
                await Notification.create({
                    title: `Customer Reply - ${ticket.ticketId}`,
                    desc: `Restaurant "${req.user.name}" replied to ticket "${ticket.subject}".`,
                    type: 'Info',
                    restaurantId: ticket.restaurantId
                });
            }
        }

        res.status(201).json(reply);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark replies as read
// @route   POST /api/support/tickets/:id/read
// @access  Private
export const markRepliesAsRead = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        await TicketReply.updateMany(
            { ticketId: ticket._id, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Rate resolved ticket (CSAT Rating)
// @route   POST /api/support/tickets/:id/rate
// @access  Private (Enterprise Restaurant Only)
export const rateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        if (ticket.restaurantId.toString() !== req.user.restaurantId?.toString()) {
            return res.status(403).json({ message: 'Unauthorized access.' });
        }

        const { csatRating, csatFeedback } = req.body;

        if (!csatRating || csatRating < 1 || csatRating > 5) {
            return res.status(400).json({ message: 'Please provide a valid rating between 1 and 5 stars.' });
        }

        ticket.csatRating = csatRating;
        ticket.csatFeedback = csatFeedback || '';
        await ticket.save();

        await logActivity(ticket._id, 'Rated', req, `Ticket rated ${csatRating} stars by customer.`);

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    List support agents with workload details
// @route   GET /api/support/agents
// @access  Private (SuperAdmin/SupportAgent Only)
export const getSupportAgents = async (req, res) => {
    try {
        const agents = await SupportAgent.find()
            .populate('userId', 'name email role')
            .sort({ workload: 1 });

        res.json(agents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register user as Support Agent or update status
// @route   POST /api/support/agents
// @access  Private (SuperAdmin Only)
export const updateSupportAgent = async (req, res) => {
    try {
        const { userId, isActive } = req.body;
        
        let agent = await SupportAgent.findOne({ userId });
        if (agent) {
            if (isActive !== undefined) agent.isActive = isActive;
            await agent.save();
        } else {
            agent = new SupportAgent({
                userId,
                isActive: isActive !== undefined ? isActive : true
            });
            await agent.save();
        }

        // Make sure user role is SupportAgent if not already SuperAdmin
        const user = await User.findById(userId);
        if (user && user.role !== 'SuperAdmin' && user.role !== 'SupportAgent') {
            user.role = 'SupportAgent';
            await user.save();
        }

        res.json(agent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- KNOWLEDGE BASE ---

// @desc    Get Knowledge Base articles
// @route   GET /api/support/knowledge-base
// @access  Private
export const getKnowledgeBase = async (req, res) => {
    try {
        let query = {};
        if (req.query.category) {
            query.category = req.query.category;
        }

        let search = {};
        if (req.query.search) {
            search = {
                $or: [
                    { title: { $regex: req.query.search, $options: 'i' } },
                    { content: { $regex: req.query.search, $options: 'i' } }
                ]
            };
        }

        const articles = await KnowledgeBase.find({ ...query, ...search })
            .sort({ views: -1, createdAt: -1 });

        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single article
// @route   GET /api/support/knowledge-base/:id
// @access  Private
export const getKnowledgeBaseArticle = async (req, res) => {
    try {
        const article = await KnowledgeBase.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!article) return res.status(404).json({ message: 'Article not found.' });
        res.json(article);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Knowledge Base Article
// @route   POST /api/support/knowledge-base
// @access  Private (SuperAdmin/SupportAgent Only)
export const createKnowledgeBaseArticle = async (req, res) => {
    try {
        const { title, content, category } = req.body;
        const article = new KnowledgeBase({ title, content, category });
        await article.save();
        res.status(201).json(article);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Knowledge Base Article
// @route   PUT /api/support/knowledge-base/:id
// @access  Private (SuperAdmin/SupportAgent Only)
export const updateKnowledgeBaseArticle = async (req, res) => {
    try {
        const article = await KnowledgeBase.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!article) return res.status(404).json({ message: 'Article not found.' });
        res.json(article);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Knowledge Base Article
// @route   DELETE /api/support/knowledge-base/:id
// @access  Private (SuperAdmin/SupportAgent Only)
export const deleteKnowledgeBaseArticle = async (req, res) => {
    try {
        const article = await KnowledgeBase.findByIdAndDelete(req.params.id);
        if (!article) return res.status(404).json({ message: 'Article not found.' });
        res.json({ message: 'Article removed successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- ANNOUNCEMENTS ---

// @desc    Get active support announcements
// @route   GET /api/support/announcements
// @access  Private
export const getAnnouncements = async (req, res) => {
    try {
        const query = { isActive: true };
        if (req.query.type) {
            query.type = req.query.type;
        }
        const announcements = await SupportAnnouncement.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create announcements
// @route   POST /api/support/announcements
// @access  Private (SuperAdmin/SupportAgent Only)
export const createAnnouncement = async (req, res) => {
    try {
        const { title, content, type } = req.body;
        const announcement = new SupportAnnouncement({
            title,
            content,
            type,
            createdBy: req.user._id
        });
        await announcement.save();
        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update announcements
// @route   PUT /api/support/announcements/:id
// @access  Private (SuperAdmin/SupportAgent Only)
export const updateAnnouncement = async (req, res) => {
    try {
        const announcement = await SupportAnnouncement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
        res.json(announcement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- SUPPORT ANALYTICS ---

// @desc    Get support ticket analytics
// @route   GET /api/support/analytics
// @access  Private
export const getSupportAnalytics = async (req, res) => {
    try {
        const isSuperAdminOrAgent = req.user.role === 'SuperAdmin' || req.user.role === 'SupportAgent';
        let matchQuery = {};
        
        if (!isSuperAdminOrAgent) {
            matchQuery.restaurantId = req.user.restaurantId;
        }

        // Stats aggregates
        const totalOpen = await Ticket.countDocuments({ ...matchQuery, status: 'Open' });
        const totalAssigned = await Ticket.countDocuments({ ...matchQuery, status: 'Assigned' });
        const totalInProgress = await Ticket.countDocuments({ ...matchQuery, status: 'In Progress' });
        const totalWaiting = await Ticket.countDocuments({ ...matchQuery, status: 'Waiting for Customer' });
        const totalResolved = await Ticket.countDocuments({ ...matchQuery, status: 'Resolved' });
        const totalClosed = await Ticket.countDocuments({ ...matchQuery, status: 'Closed' });
        const totalCritical = await Ticket.countDocuments({ ...matchQuery, priority: 'Critical' });
        
        // Compute CSAT Rating
        const csatAggregation = await Ticket.aggregate([
            { $match: { ...matchQuery, csatRating: { $ne: null } } },
            { $group: { _id: null, avgCsat: { $avg: '$csatRating' }, totalRated: { $sum: 1 } } }
        ]);
        const avgCsat = csatAggregation.length > 0 ? Number(csatAggregation[0].avgCsat.toFixed(1)) : 0;
        const totalRated = csatAggregation.length > 0 ? csatAggregation[0].totalRated : 0;

        // Tickets created this week vs resolved this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const createdThisWeek = await Ticket.countDocuments({ ...matchQuery, createdAt: { $gte: oneWeekAgo } });
        const resolvedThisWeek = await Ticket.countDocuments({ ...matchQuery, status: 'Resolved', updatedAt: { $gte: oneWeekAgo } });

        // Average response/resolution time
        const timeAggregation = await Ticket.aggregate([
            { $match: { ...matchQuery, resolutionTime: { $ne: null } } },
            { $group: { _id: null, avgResolution: { $avg: '$resolutionTime' } } }
        ]);
        const avgResolutionTime = timeAggregation.length > 0 ? Math.round(timeAggregation[0].avgResolution) : 0;

        // Categories distribution
        const categoryAggregation = await Ticket.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        
        const trendAggregation = await Ticket.aggregate([
            { 
                $match: { 
                    ...matchQuery, 
                    createdAt: { $gte: sixMonthsAgo } 
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    created: { $sum: 1 },
                    resolved: {
                        $sum: {
                            $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const activeAgentsCount = await SupportAgent.countDocuments({ isActive: true });

        res.json({
            summary: {
                totalOpen,
                totalAssigned,
                totalInProgress,
                totalWaiting,
                totalResolved,
                totalClosed,
                totalCritical,
                avgCsat,
                totalRated,
                activeAgentsCount,
                createdThisWeek,
                resolvedThisWeek,
                avgResolutionTime
            },
            categories: categoryAggregation.map(c => ({ category: c._id, count: c.count })),
            trend: trendAggregation.map(t => ({
                monthName: new Date(t._id.year, t._id.month - 1).toLocaleString('default', { month: 'short' }),
                created: t.created,
                resolved: t.resolved
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
