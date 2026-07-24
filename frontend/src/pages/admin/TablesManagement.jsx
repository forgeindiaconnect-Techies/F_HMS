import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Store, QrCode, X, Printer, Download, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const TablesManagement = () => {
    const { api } = useAuth();
    const [tables, setTables] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [localIp, setLocalIp] = useState('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);

    const [formData, setFormData] = useState({
        tableNumber: '',
        capacity: 4,
        branchId: ''
    });

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: true
    });

    const fetchData = async () => {
        try {
            const [tablesRes, branchesRes] = await Promise.all([
                api.get('/tables').catch(() => ({ data: [] })),
                api.get('/branches')
            ]);
            setTables(tablesRes.data);
            setBranches(branchesRes.data);
            
            if (branchesRes.data.length > 0 && !formData.branchId) {
                setFormData(prev => ({ ...prev, branchId: branchesRes.data[0]._id }));
            }
        } catch (error) {
            console.error('Failed to fetch tables', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddClick = () => {
        setFormData({
            tableNumber: '',
            capacity: 4,
            branchId: branches.length > 0 ? branches[0]._id : ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tables', formData);
            fetchData();
            setIsModalOpen(false);
            toast.success('Table created successfully');
        } catch (error) {
            console.error('Failed to create table', error);
            toast.error(error.response?.data?.message || 'Failed to create table');
        }
    };

    const openQrModal = (table) => {
        setSelectedTable(table);
        setIsQrModalOpen(true);
    };

    const getQrUrl = (table) => {
        if (!table) return '';
        let origin = window.location.origin;
        if (localIp) {
            origin = origin.replace(/localhost|127\.0\.0\.1/, localIp);
        }
        return `${origin}/customer/menu?restaurantId=${table.restaurantId}&branchId=${table.branchId}&tableNumber=${table.tableNumber}`;
    };

    const getQrImageSrc = (table) => {
        if (!table) return '';
        const url = getQrUrl(table);
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    };

    const handlePrintQr = () => {
        const printWindow = window.open('', '_blank');
        const qrUrl = getQrImageSrc(selectedTable);
        const codeUrl = getQrUrl(selectedTable);

        printWindow.document.write(`
            <html>
                <head>
                    <title>Table ${selectedTable.tableNumber} QR Code</title>
                    <style>
                        body {
                            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                            text-align: center;
                            padding: 40px;
                            color: #333;
                        }
                        .qr-card {
                            border: 3px solid #10b981;
                            border-radius: 24px;
                            padding: 30px;
                            display: inline-block;
                            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                        }
                        h1 {
                            margin-bottom: 5px;
                            font-size: 28px;
                            color: #047857;
                        }
                        h2 {
                            margin-top: 0;
                            font-size: 16px;
                            color: #6b7280;
                            margin-bottom: 25px;
                        }
                        img {
                            width: 250px;
                            height: 250px;
                        }
                        .instructions {
                            margin-top: 25px;
                            font-size: 14px;
                            font-weight: bold;
                            color: #059669;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }
                    </style>
                </head>
                <body>
                    <div class="qr-card">
                        <h1>TABLE ${selectedTable.tableNumber}</h1>
                        <h2>Capacity: ${selectedTable.capacity} guests</h2>
                        <img src="${qrUrl}" alt="Table ${selectedTable.tableNumber} QR" />
                        <p class="instructions">Scan to Order Menu</p>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filteredTables = tables.filter(t => 
        String(t.tableNumber).includes(searchQuery)
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return 'bg-green-100 text-green-700 border-green-200';
            case 'Occupied': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Reserved': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Cleaning': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'Billing': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 relative pb-20">
            <ConfirmModal 
                {...confirmModal} 
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})} 
            />

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>QR Table Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage restaurant tables and generate customer QR menu access points.</p>
                </div>
                <button 
                    onClick={handleAddClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
                >
                    <Plus size={18} /> Add Table
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search by table number..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    />
                </div>
            </div>

            {/* Grid display */}
            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : filteredTables.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center text-gray-500">
                    <QrCode size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-bold">No Tables Set Up</p>
                    <p className="text-sm mt-1">Click "Add Table" above to create tables and generate smart scan QR codes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTables.map((table) => (
                        <div key={table._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col p-5 space-y-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-xl font-black text-gray-900">Table {table.tableNumber}</h4>
                                    <p className="text-xs text-gray-400 font-semibold uppercase mt-0.5 flex items-center gap-1">
                                        <Store size={12} /> {table.branchId?.name || 'Main Branch'}
                                    </p>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(table.status)}`}>
                                    {table.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                <Users size={16} className="text-gray-400" />
                                <span>Capacity: <strong>{table.capacity} guests</strong></span>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                                <button 
                                    onClick={() => openQrModal(table)}
                                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-green-500/10"
                                >
                                    <QrCode size={14} /> Scan Code
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Table Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <h3 className="font-bold text-gray-900 text-lg">Add New Table</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Table Number (ID)</label>
                                <input 
                                    type="number" 
                                    required
                                    value={formData.tableNumber}
                                    onChange={(e) => setFormData({...formData, tableNumber: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="e.g. 1, 2, 3"
                                    min="1"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Seats)</label>
                                <input 
                                    type="number" 
                                    required
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="e.g. 4, 6"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                <select 
                                    value={formData.branchId}
                                    onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    required
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(b => (
                                        <option key={b._id} value={b._id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 shrink-0 mt-6 -mx-6 -mb-6">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors text-sm shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm"
                                >
                                    Add Table
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Display Modal */}
            {isQrModalOpen && selectedTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsQrModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col p-6 items-center text-center">
                        <button 
                            onClick={() => setIsQrModalOpen(false)} 
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mt-4 mb-4">
                            <h3 className="text-2xl font-black text-emerald-800 tracking-wider">TABLE {selectedTable.tableNumber}</h3>
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-0.5">RestoSys QR Ordering</p>
                            
                            <div className="bg-white p-4 rounded-xl border border-gray-150 mt-4 shadow-sm">
                                <img 
                                    src={getQrImageSrc(selectedTable)} 
                                    alt={`Table ${selectedTable.tableNumber} QR Code`}
                                    className="w-48 h-48"
                                />
                            </div>
                        </div>

                        <p className="text-sm font-medium text-gray-500 mb-4 max-w-[250px]">
                            Scan this QR code to view the menu and place dine-in orders instantly.
                        </p>

                        <div className="w-full space-y-3 mb-6 text-left">
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-150 text-xs">
                                <span className="font-bold text-gray-500 block mb-1">Click to Test on Desktop:</span>
                                <a 
                                    href={getQrUrl(selectedTable)} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-green-600 hover:underline font-extrabold break-all"
                                >
                                    Open Customer Menu ↗
                                </a>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                                    Testing on mobile? Enter PC Local IP
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 192.168.1.15" 
                                    value={localIp}
                                    onChange={(e) => setLocalIp(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-green-500 text-center"
                                />
                                <p className="text-[9px] text-gray-400 mt-1 text-center leading-normal">
                                    Ensure your mobile phone is connected to the same Wi-Fi network.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full">
                            <button 
                                onClick={handlePrintQr}
                                className="py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <Printer size={16} /> Print Card
                            </button>
                            <a 
                                href={getQrImageSrc(selectedTable)} 
                                download={`table_${selectedTable.tableNumber}_qr.png`}
                                target="_blank"
                                rel="noreferrer"
                                className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5 border border-gray-200"
                            >
                                <Download size={16} /> Download
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablesManagement;
