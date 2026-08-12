import { useState, useMemo } from 'react';
import { 
    Building2, MapPin, Users, Shield, Plus, Edit3, Trash2, 
    Search, Filter, CheckCircle, XCircle, X, Save, Download, 
    ChevronDown, AlertCircle, Sparkles, UserPlus, Sliders, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const REGIONS = [
    'North Region',
    'West Region',
    'South Region',
    'East Region',
    'Central Region',
    'Airport & Transit Hubs'
];

const INITIAL_FRANCHISES = [
    {
        id: 'fr-1',
        code: 'FR-MUM-01',
        name: 'RestoHub Mumbai Central',
        region: 'West Region',
        location: 'Mumbai Central, Maharashtra',
        address: 'Plot 42, Senapati Bapat Marg, Mumbai - 400013',
        ownerName: 'Sarah Connor',
        ownerEmail: 'sarah.mumbai@restohub.com',
        ownerPhone: '+91 98200 11223',
        royaltyRate: 8.0,
        monthlyRevenue: 1850000,
        agreementStartDate: '2024-01-15',
        agreementExpiryDate: '2029-01-14',
        status: 'Active',
        assignedUsers: [
            { id: 'u1', name: 'Sarah Connor', role: 'Franchise Owner / Manager', email: 'sarah.mumbai@restohub.com' },
            { id: 'u2', name: 'Rahul Sharma', role: 'Head Cashier', email: 'rahul.s@restohub.com' },
            { id: 'u3', name: 'Pooja Verma', role: 'Kitchen Lead', email: 'pooja.v@restohub.com' }
        ],
        permissions: {
            roleName: 'Full Control',
            posAccess: true,
            menuCustomization: false,
            royaltyReports: true,
            inventoryOps: true,
            staffManagement: true
        }
    },
    {
        id: 'fr-2',
        code: 'FR-DEL-02',
        name: 'RestoHub IGI Airport T3',
        region: 'Airport & Transit Hubs',
        location: 'IGI Airport Terminal 3, New Delhi',
        address: 'Departure Gate 14, Airside Food Court, New Delhi - 110037',
        ownerName: 'John Connor',
        ownerEmail: 'john.delhi@restohub.com',
        ownerPhone: '+91 98110 44556',
        royaltyRate: 10.0,
        monthlyRevenue: 3420000,
        agreementStartDate: '2023-06-01',
        agreementExpiryDate: '2028-05-31',
        status: 'Active',
        assignedUsers: [
            { id: 'u4', name: 'John Connor', role: 'Franchise Partner', email: 'john.delhi@restohub.com' },
            { id: 'u5', name: 'Amitabh Sen', role: 'Shift Operations Supervisor', email: 'amitabh.s@restohub.com' }
        ],
        permissions: {
            roleName: 'Operations & Billing',
            posAccess: true,
            menuCustomization: false,
            royaltyReports: false,
            inventoryOps: true,
            staffManagement: true
        }
    },
    {
        id: 'fr-3',
        code: 'FR-GUR-03',
        name: 'RestoHub CyberHub',
        region: 'North Region',
        location: 'Cyber City, Gurugram, Haryana',
        address: 'Unit 102, Building 8B, DLF Cyber City, Gurugram - 122002',
        ownerName: 'Vikram Malhotra',
        ownerEmail: 'vikram.gurgaon@restohub.com',
        ownerPhone: '+91 99100 77889',
        royaltyRate: 8.5,
        monthlyRevenue: 2210000,
        agreementStartDate: '2024-03-01',
        agreementExpiryDate: '2029-02-28',
        status: 'Active',
        assignedUsers: [
            { id: 'u6', name: 'Vikram Malhotra', role: 'Store General Manager', email: 'vikram.gurgaon@restohub.com' }
        ],
        permissions: {
            roleName: 'Full Control',
            posAccess: true,
            menuCustomization: true,
            royaltyReports: true,
            inventoryOps: true,
            staffManagement: true
        }
    },
    {
        id: 'fr-4',
        code: 'FR-BLR-04',
        name: 'RestoHub Indiranagar',
        region: 'South Region',
        location: 'Indiranagar 100ft Road, Bengaluru',
        address: '772, 100 Feet Road, HAL 2nd Stage, Bengaluru - 560038',
        ownerName: 'Ananya Rao',
        ownerEmail: 'ananya.blr@restohub.com',
        ownerPhone: '+91 98450 33445',
        royaltyRate: 7.5,
        monthlyRevenue: 1540000,
        agreementStartDate: '2023-11-10',
        agreementExpiryDate: '2028-11-09',
        status: 'Inactive',
        assignedUsers: [
            { id: 'u7', name: 'Ananya Rao', role: 'Store Franchisee', email: 'ananya.blr@restohub.com' }
        ],
        permissions: {
            roleName: 'View Only',
            posAccess: false,
            menuCustomization: false,
            royaltyReports: true,
            inventoryOps: false,
            staffManagement: false
        }
    }
];

const FranchiseManagement = () => {
    const [franchises, setFranchises] = useState(INITIAL_FRANCHISES);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');

    // Modals state
    const [showStoreModal, setShowStoreModal] = useState(false);
    const [editingFranchise, setEditingFranchise] = useState(null);

    const [showUserModal, setShowUserModal] = useState(false);
    const [userAssignTarget, setUserAssignTarget] = useState(null);
    const [newUserForm, setNewUserForm] = useState({ name: '', role: 'Franchise Manager', email: '' });

    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [permTarget, setPermTarget] = useState(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    // Form state for store create/edit
    const [storeForm, setStoreForm] = useState({
        code: '',
        name: '',
        region: 'West Region',
        location: '',
        address: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        royaltyRate: 8.0,
        agreementStartDate: new Date().toISOString().split('T')[0],
        agreementExpiryDate: new Date(Date.now() + 5 * 365 * 86400000).toISOString().split('T')[0],
        status: 'Active'
    });

    // Filtering logic
    const filteredFranchises = useMemo(() => {
        return franchises.filter(f => {
            const matchesSearch = 
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.location.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRegion = selectedRegion === 'All' || f.region === selectedRegion;
            const matchesStatus = selectedStatus === 'All' || f.status === selectedStatus;

            return matchesSearch && matchesRegion && matchesStatus;
        });
    }, [franchises, searchQuery, selectedRegion, selectedStatus]);

    // Metrics calculations
    const totalFranchises = franchises.length;
    const activeFranchises = franchises.filter(f => f.status === 'Active').length;
    const totalRevenueMTD = franchises.reduce((acc, curr) => acc + (curr.monthlyRevenue || 0), 0);
    const totalRoyaltyMTD = franchises.reduce((acc, curr) => acc + ((curr.monthlyRevenue || 0) * (curr.royaltyRate / 100)), 0);

    // Open store modal for create or edit
    const handleOpenStoreModal = (franchise = null) => {
        if (franchise) {
            setEditingFranchise(franchise);
            setStoreForm({ ...franchise });
        } else {
            setEditingFranchise(null);
            setStoreForm({
                code: `FR-${Math.floor(100 + Math.random() * 900)}`,
                name: '',
                region: 'West Region',
                location: '',
                address: '',
                ownerName: '',
                ownerEmail: '',
                ownerPhone: '',
                royaltyRate: 8.0,
                agreementStartDate: new Date().toISOString().split('T')[0],
                agreementExpiryDate: new Date(Date.now() + 5 * 365 * 86400000).toISOString().split('T')[0],
                status: 'Active'
            });
        }
        setShowStoreModal(true);
    };

    // Save Store (Create or Update)
    const handleSaveStore = (e) => {
        e.preventDefault();
        if (!storeForm.name || !storeForm.location || !storeForm.ownerName || !storeForm.ownerEmail) {
            return toast.error('Please fill in all mandatory store details.');
        }

        if (editingFranchise) {
            setFranchises(franchises.map(f => f.id === editingFranchise.id ? { ...f, ...storeForm } : f));
            toast.success(`Franchise "${storeForm.name}" updated successfully.`);
        } else {
            const newStore = {
                ...storeForm,
                id: `fr-${Date.now()}`,
                monthlyRevenue: 0,
                assignedUsers: [
                    { id: `u-${Date.now()}`, name: storeForm.ownerName, role: 'Franchise Owner / Manager', email: storeForm.ownerEmail }
                ],
                permissions: {
                    roleName: 'Full Control',
                    posAccess: true,
                    menuCustomization: false,
                    royaltyReports: true,
                    inventoryOps: true,
                    staffManagement: true
                }
            };
            setFranchises([newStore, ...franchises]);
            toast.success(`New Franchise Store "${storeForm.name}" created!`);
        }

        setShowStoreModal(false);
    };

    // Delete Store
    const handleDeleteStore = (id) => {
        setFranchises(franchises.filter(f => f.id !== id));
        toast.success('Franchise store deleted.');
        setShowDeleteConfirm(null);
    };

    // Toggle Status (Active / Inactive)
    const handleToggleStatus = (id) => {
        setFranchises(franchises.map(f => {
            if (f.id === id) {
                const nextStatus = f.status === 'Active' ? 'Inactive' : 'Active';
                toast.success(`Store "${f.name}" status changed to ${nextStatus}`);
                return { ...f, status: nextStatus };
            }
            return f;
        }));
    };

    // User Assignment Handlers
    const handleOpenUserModal = (franchise) => {
        setUserAssignTarget(franchise);
        setNewUserForm({ name: '', role: 'Franchise Manager', email: '' });
        setShowUserModal(true);
    };

    const handleAddUserToFranchise = (e) => {
        e.preventDefault();
        if (!newUserForm.name || !newUserForm.email) {
            return toast.error('Please enter name and email for the assigned user.');
        }

        const newUser = {
            id: `usr-${Date.now()}`,
            name: newUserForm.name,
            role: newUserForm.role,
            email: newUserForm.email
        };

        setFranchises(franchises.map(f => {
            if (f.id === userAssignTarget.id) {
                return { ...f, assignedUsers: [...(f.assignedUsers || []), newUser] };
            }
            return f;
        }));

        setUserAssignTarget(prev => ({ ...prev, assignedUsers: [...(prev.assignedUsers || []), newUser] }));
        setNewUserForm({ name: '', role: 'Franchise Manager', email: '' });
        toast.success(`User ${newUser.name} assigned to franchise.`);
    };

    const handleRemoveUserFromFranchise = (userId) => {
        setFranchises(franchises.map(f => {
            if (f.id === userAssignTarget.id) {
                const updated = f.assignedUsers.filter(u => u.id !== userId);
                return { ...f, assignedUsers: updated };
            }
            return f;
        }));

        setUserAssignTarget(prev => ({
            ...prev,
            assignedUsers: prev.assignedUsers.filter(u => u.id !== userId)
        }));

        toast.success('Assigned user removed.');
    };

    // Permissions Handler
    const handleOpenPermissionsModal = (franchise) => {
        setPermTarget(franchise);
        setShowPermissionsModal(true);
    };

    const handleSavePermissions = () => {
        setFranchises(franchises.map(f => f.id === permTarget.id ? { ...f, permissions: permTarget.permissions } : f));
        toast.success(`Role & Permissions updated for ${permTarget.name}`);
        setShowPermissionsModal(false);
    };

    // Export CSV
    const handleExportCSV = () => {
        const headers = ["Store Code", "Name", "Region", "Location", "Owner", "Royalty Rate", "Monthly Sales", "Status"];
        const rows = filteredFranchises.map(f => [
            f.code, f.name, f.region, f.location, f.ownerName, `${f.royaltyRate}%`, `₹${f.monthlyRevenue}`, f.status
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Franchise_Report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Franchise report exported as CSV.');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-sans text-gray-900 dark:text-slate-100">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Franchise Management
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold mt-0.5">
                        Manage franchise store profiles, user assignments, role permissions, region mapping, and royalty tracking.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                    <button
                        onClick={() => handleOpenStoreModal(null)}
                        className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> Add Franchise Store
                    </button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Franchises</span>
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Building2 size={18} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-slate-100">{totalFranchises} Stores</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Mapped across {REGIONS.length} regions</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Active Store Outlets</span>
                        <div className="p-2 bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 rounded-xl">
                            <CheckCircle size={18} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-green-600 dark:text-green-400">{activeFranchises} Active</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{totalFranchises - activeFranchises} currently inactive</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Monthly Revenue</span>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <Sparkles size={18} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-slate-100">₹{totalRevenueMTD.toLocaleString('en-IN')}</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Combined monthly sales volume</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Royalty Share (MTD)</span>
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
                            <Shield size={18} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400">₹{Math.round(totalRoyaltyMTD).toLocaleString('en-IN')}</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Calculated based on franchise agreements</p>
                </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Search */}
                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search store name, code, owner, location..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    />
                    <Search size={16} className="absolute left-3.5 top-3 text-gray-400 dark:text-slate-500" />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Region:</span>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-800 dark:text-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                        >
                            <option value="All">All Regions ({REGIONS.length})</option>
                            {REGIONS.map(reg => (
                                <option key={reg} value={reg}>{reg}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Status:</span>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-800 dark:text-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Franchise Stores Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/40">
                    <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                        Franchise Outlet Stores ({filteredFranchises.length})
                    </h3>
                </div>

                {filteredFranchises.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                        <Building2 size={40} className="text-gray-300 dark:text-slate-600" />
                        <h4 className="font-extrabold text-gray-900 dark:text-slate-100 text-sm">No franchise stores found</h4>
                        <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">Try adjusting search term or region filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-slate-950/60 border-b border-gray-100 dark:border-slate-800 text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                    <th className="p-4">Store Profile</th>
                                    <th className="p-4">Region / Location Mapping</th>
                                    <th className="p-4">Owner & Assigned Users</th>
                                    <th className="p-4">Royalty & Terms</th>
                                    <th className="p-4">Role Permissions</th>
                                    <th className="p-4">Store Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300">
                                {filteredFranchises.map((f) => (
                                    <tr key={f.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                        {/* Store Name */}
                                        <td className="p-4 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-xs text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">{f.code}</span>
                                                <span className="font-bold text-gray-900 dark:text-slate-100 text-sm">{f.name}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate max-w-xs">{f.address}</p>
                                        </td>

                                        {/* Region / Location */}
                                        <td className="p-4 space-y-1">
                                            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/50">
                                                {f.region}
                                            </span>
                                            <p className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1 mt-1">
                                                <MapPin size={12} className="text-gray-400" /> {f.location}
                                            </p>
                                        </td>

                                        {/* Owner & Assigned Users */}
                                        <td className="p-4 space-y-1">
                                            <div className="font-bold text-gray-900 dark:text-slate-100">{f.ownerName}</div>
                                            <p className="text-[10px] text-gray-400 dark:text-slate-500">{f.ownerEmail}</p>
                                            <button 
                                                onClick={() => handleOpenUserModal(f)}
                                                className="text-[10px] text-green-600 dark:text-green-400 font-bold hover:underline inline-flex items-center gap-1 mt-1"
                                            >
                                                <Users size={10} /> {(f.assignedUsers || []).length} Users Assigned (Manage)
                                            </button>
                                        </td>

                                        {/* Royalty & Terms */}
                                        <td className="p-4 space-y-1">
                                            <div className="font-black text-green-600 dark:text-green-400">{f.royaltyRate}% Royalty</div>
                                            <p className="text-[10px] text-gray-400 dark:text-slate-500">Exp: {new Date(f.agreementExpiryDate).toLocaleDateString()}</p>
                                            <p className="text-xs font-extrabold text-gray-800 dark:text-slate-200">MTD: ₹{f.monthlyRevenue ? f.monthlyRevenue.toLocaleString('en-IN') : '0'}</p>
                                        </td>

                                        {/* Permissions & Roles */}
                                        <td className="p-4 space-y-1">
                                            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                                                {f.permissions?.roleName || 'Full Control'}
                                            </span>
                                            <div>
                                                <button 
                                                    onClick={() => handleOpenPermissionsModal(f)}
                                                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1 mt-1"
                                                >
                                                    <Shield size={10} /> Edit Permissions
                                                </button>
                                            </div>
                                        </td>

                                        {/* Store Status Toggle */}
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleToggleStatus(f.id)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 ${
                                                    f.status === 'Active'
                                                    ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-100'
                                                    : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-100'
                                                }`}
                                            >
                                                {f.status === 'Active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                <span>{f.status}</span>
                                            </button>
                                        </td>

                                        {/* Action buttons */}
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenStoreModal(f)}
                                                    className="p-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl transition-colors border border-gray-200 dark:border-slate-700"
                                                    title="Edit Store Details"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(f)}
                                                    className="p-2 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-xl transition-colors border border-red-100 dark:border-red-900/50"
                                                    title="Delete Store"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL 1: CREATE / EDIT FRANCHISE STORE */}
            {showStoreModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-black">{editingFranchise ? 'Edit Franchise Store' : 'Create Franchise Store'}</h3>
                                <p className="text-xs text-slate-300">Maintain store details, location mapping, and royalty percentage.</p>
                            </div>
                            <button onClick={() => setShowStoreModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveStore} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Store Code</label>
                                    <input
                                        type="text"
                                        value={storeForm.code}
                                        onChange={(e) => setStoreForm({ ...storeForm, code: e.target.value })}
                                        placeholder="e.g. FR-MUM-01"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Franchise Store Name *</label>
                                    <input
                                        type="text"
                                        value={storeForm.name}
                                        onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                                        placeholder="e.g. RestoHub Bandra West"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Region Mapping *</label>
                                    <select
                                        value={storeForm.region}
                                        onChange={(e) => setStoreForm({ ...storeForm, region: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-500"
                                    >
                                        {REGIONS.map(reg => (
                                            <option key={reg} value={reg}>{reg}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">City / Location *</label>
                                    <input
                                        type="text"
                                        value={storeForm.location}
                                        onChange={(e) => setStoreForm({ ...storeForm, location: e.target.value })}
                                        placeholder="e.g. Bandra West, Mumbai"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Full Street Address</label>
                                <textarea
                                    value={storeForm.address}
                                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                                    placeholder="Complete street address..."
                                    rows={2}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Owner Name *</label>
                                    <input
                                        type="text"
                                        value={storeForm.ownerName}
                                        onChange={(e) => setStoreForm({ ...storeForm, ownerName: e.target.value })}
                                        placeholder="Franchisee Name"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Owner Email *</label>
                                    <input
                                        type="email"
                                        value={storeForm.ownerEmail}
                                        onChange={(e) => setStoreForm({ ...storeForm, ownerEmail: e.target.value })}
                                        placeholder="owner@domain.com"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={storeForm.ownerPhone}
                                        onChange={(e) => setStoreForm({ ...storeForm, ownerPhone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Royalty Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={storeForm.royaltyRate}
                                        onChange={(e) => setStoreForm({ ...storeForm, royaltyRate: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Agreement Start</label>
                                    <input
                                        type="date"
                                        value={storeForm.agreementStartDate}
                                        onChange={(e) => setStoreForm({ ...storeForm, agreementStartDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Agreement Expiry</label>
                                    <input
                                        type="date"
                                        value={storeForm.agreementExpiryDate}
                                        onChange={(e) => setStoreForm({ ...storeForm, agreementExpiryDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Initial Store Operating Status</label>
                                <select
                                    value={storeForm.status}
                                    onChange={(e) => setStoreForm({ ...storeForm, status: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-500"
                                >
                                    <option value="Active">Active (Operating & Synced)</option>
                                    <option value="Inactive">Inactive (Suspended / Under Setup)</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 shrink-0 border-t border-gray-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowStoreModal(false)}
                                    className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
                                >
                                    <Save size={14} /> {editingFranchise ? 'Save Changes' : 'Create Franchise'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: ASSIGN FRANCHISE USERS */}
            {showUserModal && userAssignTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-black">Assign Franchise Users</h3>
                                <p className="text-xs text-slate-300">{userAssignTarget.name} ({userAssignTarget.code})</p>
                            </div>
                            <button onClick={() => setShowUserModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            {/* Form to add user */}
                            <form onSubmit={handleAddUserToFranchise} className="bg-gray-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3">
                                <h4 className="text-xs font-black uppercase text-gray-500 dark:text-slate-400">Assign New User</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Full Name *"
                                        value={newUserForm.name}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email Address *"
                                        value={newUserForm.email}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={newUserForm.role}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                    >
                                        <option value="Franchise Manager">Franchise Manager</option>
                                        <option value="Assistant Manager">Assistant Manager</option>
                                        <option value="Head Cashier / Billing">Head Cashier / Billing</option>
                                        <option value="Kitchen Supervisor">Kitchen Supervisor</option>
                                    </select>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded-xl shadow-sm shrink-0 flex items-center gap-1.5"
                                    >
                                        <UserPlus size={14} /> Assign User
                                    </button>
                                </div>
                            </form>

                            {/* Assigned users list */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase text-gray-500 dark:text-slate-400">Currently Assigned Users ({userAssignTarget.assignedUsers?.length || 0})</h4>
                                {(userAssignTarget.assignedUsers || []).length === 0 ? (
                                    <p className="text-xs text-gray-400 font-medium">No users assigned yet.</p>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                        {userAssignTarget.assignedUsers.map((u) => (
                                            <div key={u.id} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
                                                <div className="space-y-0.5">
                                                    <div className="font-bold text-xs text-gray-900 dark:text-slate-100">{u.name}</div>
                                                    <p className="text-[10px] text-gray-400 dark:text-slate-500">{u.email} • <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{u.role}</span></p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveUserFromFranchise(u.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                                                    title="Remove Assigned User"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 flex justify-end shrink-0">
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="px-5 py-2 bg-gray-900 text-white font-bold text-xs rounded-xl"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: PERMISSIONS & ROLES MANAGEMENT */}
            {showPermissionsModal && permTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-black">Manage Role Permissions</h3>
                                <p className="text-xs text-slate-300">{permTarget.name} ({permTarget.code})</p>
                            </div>
                            <button onClick={() => setShowPermissionsModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1.5">Preset Role Level</label>
                                <select
                                    value={permTarget.permissions?.roleName || 'Full Control'}
                                    onChange={(e) => {
                                        const role = e.target.value;
                                        let preset = { roleName: role, posAccess: true, menuCustomization: false, royaltyReports: true, inventoryOps: true, staffManagement: true };
                                        if (role === 'Operations & Billing') {
                                            preset = { roleName: role, posAccess: true, menuCustomization: false, royaltyReports: false, inventoryOps: true, staffManagement: true };
                                        } else if (role === 'View Only') {
                                            preset = { roleName: role, posAccess: false, menuCustomization: false, royaltyReports: true, inventoryOps: false, staffManagement: false };
                                        }
                                        setPermTarget({ ...permTarget, permissions: preset });
                                    }}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                >
                                    <option value="Full Control">Full Control (Franchise Admin)</option>
                                    <option value="Operations & Billing">Operations & Billing Manager</option>
                                    <option value="View Only">View Only (Auditor / Spectator)</option>
                                </select>
                            </div>

                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-black uppercase text-gray-500 dark:text-slate-400">Individual Permission Flags</h4>
                                {[
                                    { key: 'posAccess', title: 'POS & Billing Access', desc: 'Allows store staff to take counter & QR orders' },
                                    { key: 'menuCustomization', title: 'Menu & Price Editing', desc: 'Override central menu items or prices locally' },
                                    { key: 'royaltyReports', title: 'Royalty & Sales Audit Access', desc: 'View monthly turnover reports and royalty fees' },
                                    { key: 'inventoryOps', title: 'Inventory & Stock Management', desc: 'Manage raw materials, waste logs, and stock transfers' },
                                    { key: 'staffManagement', title: 'Staff Shift Management', desc: 'Add staff members and manage store shifts' }
                                ].map((flag) => (
                                    <label key={flag.key} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800 cursor-pointer select-none">
                                        <div className="space-y-0.5 pr-4">
                                            <span className="text-xs font-bold text-gray-900 dark:text-slate-100 block">{flag.title}</span>
                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium block">{flag.desc}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={!!permTarget.permissions?.[flag.key]}
                                            onChange={(e) => {
                                                setPermTarget({
                                                    ...permTarget,
                                                    permissions: {
                                                        ...permTarget.permissions,
                                                        [flag.key]: e.target.checked
                                                    }
                                                });
                                            }}
                                            className="rounded text-green-600 focus:ring-green-500 w-4 h-4 mt-1"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setShowPermissionsModal(false)}
                                className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePermissions}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
                            >
                                Save Permissions
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: DELETE CONFIRMATION */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95">
                        <div className="flex items-center gap-3 text-red-600">
                            <AlertCircle size={28} />
                            <h3 className="text-lg font-black">Delete Franchise Store?</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold leading-relaxed">
                            Are you sure you want to delete <strong>{showDeleteConfirm.name} ({showDeleteConfirm.code})</strong>? This action will remove store mapping, assigned users, and royalty tracking logs.
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteStore(showDeleteConfirm.id)}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm"
                            >
                                Delete Store
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FranchiseManagement;
