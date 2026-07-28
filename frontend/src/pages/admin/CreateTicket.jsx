import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LifeBuoy, Upload, AlertCircle, X, ChevronRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateTicket = () => {
    const { api } = useAuth();
    const navigate = useNavigate();

    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const categories = [
        'Billing',
        'Subscription',
        'Orders',
        'Kitchen',
        'Inventory',
        'POS',
        'QR Digital Menu',
        'Delivery',
        'Staff Management',
        'Technical Issue',
        'Feature Request',
        'Other'
    ];

    const priorities = [
        { name: 'Low', desc: 'General queries and requests' },
        { name: 'Medium', desc: 'Functionality issues with workarounds' },
        { name: 'High', desc: 'Major disruptions without workarounds' },
        { name: 'Critical', desc: '🚨 Business down / Operations blocked' }
    ];

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        const validFiles = [];
        
        // Validate each file
        for (const file of selected) {
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
            
            if (!allowed.includes(ext)) {
                toast.error(`"${file.name}" has an invalid extension.`);
                continue;
            }

            if (file.size > 10 * 1024 * 1024) {
                toast.error(`"${file.name}" exceeds the 10MB limit.`);
                continue;
            }

            validFiles.push(file);
        }

        setFiles([...files, ...validFiles]);
    };

    const handleRemoveFile = (index) => {
        setFiles(files.filter((_, idx) => idx !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!subject.trim()) return toast.error('Subject is required');
        if (!category) return toast.error('Please select a category');
        if (!description.trim()) return toast.error('Description is required');

        setSubmitting(true);
        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('category', category);
        formData.append('priority', priority);
        formData.append('description', description);
        
        files.forEach(file => {
            formData.append('attachments', file);
        });

        try {
            await api.post('/support/tickets', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success('Ticket created successfully!');
            navigate('/admin/support/tickets');
        } catch (error) {
            console.error('Failed to create ticket:', error);
            toast.error(error.response?.data?.message || 'Failed to submit ticket');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Breadcrumb / Navigation */}
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate('/admin/support')}>Support Dashboard</span>
                <ChevronRight size={14} />
                <span className="text-gray-900">Create Support Ticket</span>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-8">
                <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                    <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                        <LifeBuoy size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Create Support Ticket</h2>
                        <p className="text-xs text-gray-400 font-semibold mt-0.5">Fill in the fields to report an issue or request assistance.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Subject */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Subject</label>
                        <input 
                            type="text" 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief summary of the issue (e.g. Printer not printing POS slips)"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-medium transition-all"
                            required
                        />
                    </div>

                    {/* Category and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Category</label>
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-medium transition-all bg-white"
                                required
                            >
                                <option value="">Select Category...</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Priority Level</label>
                            <select 
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-medium transition-all bg-white"
                            >
                                {priorities.map(p => (
                                    <option key={p.name} value={p.name}>{p.name} - {p.desc}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Show critical warning if Critical priority selected */}
                    {priority === 'Critical' && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-red-900">🚨 SLA Emergency Support Trigger</h4>
                                <p className="text-xs text-red-700 leading-relaxed font-semibold">
                                    Selecting **Critical** priority will immediately flag this ticket in the platform queue and notify on-duty technicians. Use only if operations are completely halted.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Describe the Issue</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide details about the issue. Please include steps to reproduce, order IDs, table numbers or error messages if applicable."
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-medium transition-all"
                            required
                        />
                    </div>

                    {/* File Upload / Attachments */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700 block">Screenshots or Log Files <span className="text-gray-400 font-medium">(Optional)</span></label>
                        
                        <div className="border-2 border-dashed border-gray-200 hover:border-green-500/50 rounded-2xl p-6 transition-all text-center relative flex flex-col items-center justify-center cursor-pointer bg-gray-50/20 hover:bg-gray-50/50">
                            <input 
                                type="file" 
                                multiple
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className="text-gray-400 mb-3" size={28} />
                            <span className="text-sm font-bold text-gray-700">Drag files here or click to upload</span>
                            <span className="text-[10px] text-gray-400 font-semibold mt-1">PDF, PNG, JPG, DOCX, XLSX (Max 10MB per file)</span>
                        </div>

                        {/* File preview list */}
                        {files.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {files.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white shadow-sm text-xs font-semibold">
                                        <span className="text-gray-700 truncate max-w-[200px]">{file.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveFile(i)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-gray-50 flex items-center justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => navigate('/admin/support')}
                            className="px-6 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="px-8 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <span>Submit Ticket</span>
                                    <Check size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTicket;
