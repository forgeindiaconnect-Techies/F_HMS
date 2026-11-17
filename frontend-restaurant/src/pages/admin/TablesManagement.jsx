import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Plus, Search, Trash2, Store, QrCode, X, Printer, Download, Users,
    ScanLine, Camera, ExternalLink, RefreshCw, CheckCircle2, AlertCircle,
    Smartphone, Laptop, Image as ImageIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const TablesManagement = () => {
    const { api, restaurant } = useAuth();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(() =>
        new URLSearchParams(location.search).get('tab') === 'qr' ? 'qr' : 'tables'
    );
    const [tables, setTables] = useState(() => {
        try {
            const cached = sessionStorage.getItem('restosys_tables_cache');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [branches, setBranches] = useState(() => {
        try {
            const cached = sessionStorage.getItem('restosys_branches_cache');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [loading, setLoading] = useState(() => !sessionStorage.getItem('restosys_tables_cache'));
    const [searchQuery, setSearchQuery] = useState('');

    // Auto-detect localhost / dev environment
    const isLocalhost = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(window.location.hostname)
    );

    const [qrMode, setQrMode] = useState('production');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);

    // Live Table Scanner Modal state
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannerMode, setScannerMode] = useState('camera'); // 'camera' | 'select'
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [scannedTable, setScannedTable] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [formData, setFormData] = useState({
        tableNumber: '',
        capacity: 4,
        branchId: ''
    });

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: true
    });

    const fetchData = async () => {
        try {
            const [tablesRes, branchesRes] = await Promise.all([
                api.get('/tables').catch(() => ({ data: [] })),
                api.get('/branches').catch(() => ({ data: [] }))
            ]);
            const tblList = tablesRes.data || [];
            const brList = branchesRes.data || [];
            setTables(tblList);
            setBranches(brList);
            try {
                sessionStorage.setItem('restosys_tables_cache', JSON.stringify(tblList));
                sessionStorage.setItem('restosys_branches_cache', JSON.stringify(brList));
            } catch (_) { }

            if (brList.length > 0 && !formData.branchId) {
                setFormData(prev => ({ ...prev, branchId: brList[0]._id }));
            }
        } catch (error) {
            console.error('Failed to fetch tables', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Refresh tables state every 15s
        return () => clearInterval(interval);
    }, []);

    // Stop camera video stream when scanner closes
    const stopCamera = () => {
        if (streamRef.current) {
            try {
                streamRef.current.getTracks().forEach(track => track.stop());
            } catch (_) { }
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    // Start camera video stream
    const startCamera = async () => {
        setCameraError('');
        stopCamera();
        try {
            if (!navigator?.mediaDevices?.getUserMedia) {
                throw new Error('Camera access is not supported by your browser.');
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCameraActive(true);
        } catch (err) {
            console.warn('Camera start notice:', err?.message || err);
            setCameraError(err?.message || 'Unable to access camera. Please check camera permissions or select a table below.');
            setCameraActive(false);
            setScannerMode('select');
        }
    };

    useEffect(() => {
        if (isScannerOpen && scannerMode === 'camera') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isScannerOpen, scannerMode]);

    const handleOpenScanner = () => {
        setScannedTable(tables[0] || null);
        setIsScannerOpen(true);
        setScannerMode('camera');
    };

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

    const handleDeleteClick = (table) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Table',
            message: `Are you sure you want to delete Table ${table.tableNumber}? This action cannot be undone.`,
            isDestructive: true,
            onConfirm: () => handleDeleteConfirm(table._id)
        });
    };

    const handleDeleteConfirm = async (tableId) => {
        try {
            await api.delete(`/tables/${tableId}`);
            toast.success('Table deleted successfully');
            try {
                sessionStorage.removeItem('restosys_tables_cache');
                localStorage.removeItem('restosys_tables_cache');
                window.dispatchEvent(new CustomEvent('table-deleted', { detail: tableId }));
            } catch (_) { }
            fetchData();
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error('Failed to delete table', error);
            toast.error(error.response?.data?.message || 'Failed to delete table');
        }
    };

    const openQrModal = (table) => {
        setSelectedTable(table);
        setIsQrModalOpen(true);
    };

    const getQrUrl = (table) => {
        if (!table) return '';
        let baseUrl = import.meta.env.VITE_CUSTOMER_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5174` : 'http://localhost:5174');
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

        if (isLocalhost) {
            if (qrMode === 'localhost') {
                baseUrl = 'http://localhost:5174';
            } else if (qrMode === 'network') {
                const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
                baseUrl = `http://${host}:5174`;
            } else {
                baseUrl = import.meta.env.VITE_CUSTOMER_URL || `http://${window.location.hostname}:5174`;
            }
        }

        const bId = table.branchId?._id || table.branchId || '';
        const rId = restaurant?._id || table.restaurantId?._id || table.restaurantId || (table.branchId?.restaurantId?._id || table.branchId?.restaurantId) || '';
        return `${baseUrl}/customer/menu?restaurantId=${rId}&branchId=${bId}&tableNumber=${table.tableNumber}`;
    };

    const handlePrintQr = () => {
        const printWindow = window.open('', '_blank');
        const codeUrl = getQrUrl(selectedTable);
        const svgEl = document.getElementById(`table-qr-svg-${selectedTable?._id || selectedTable?.tableNumber}`);
        const svgHtml = svgEl ? svgEl.outerHTML : '';

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
                        .instructions {
                            margin-top: 25px;
                            font-size: 14px;
                            font-weight: bold;
                            color: #059669;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }
                        .link {
                            margin-top: 10px;
                            font-size: 11px;
                            color: #6b7280;
                            word-break: break-all;
                        }
                    </style>
                </head>
                <body>
                    <div class="qr-card">
                        <h1>TABLE ${selectedTable.tableNumber}</h1>
                        <h2>Capacity: ${selectedTable.capacity} guests</h2>
                        <div style="display:flex; justify-content:center; margin: 20px 0;">
                            ${svgHtml}
                        </div>
                        <p class="instructions">Scan to Order Menu</p>
                        <p class="link">${codeUrl}</p>
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

    const handleDownloadQr = () => {
        if (!selectedTable) return;
        const svgEl = document.getElementById(`table-qr-svg-${selectedTable?._id || selectedTable?.tableNumber}`);
        if (!svgEl) return;
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = `table_${selectedTable.tableNumber}_qr.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
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
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />

            {/* Header & Unified Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Table Management &amp; QR Digital Menu
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage dining tables, scan QR codes with live camera, and generate contactless menus.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
                        <button
                            type="button"
                            onClick={() => setActiveTab('tables')}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'tables' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Users size={14} /> Tables ({tables.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('qr')}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'qr' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <QrCode size={14} /> QR Digital Menu
                        </button>
                    </div>

                    {/* Table Scanner Trigger Button */}
                    <button
                        type="button"
                        onClick={handleOpenScanner}
                        className="bg-slate-900 hover:bg-black text-white px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer"
                        title="Scan Table QR with Camera or Test Digital Ordering"
                    >
                        <ScanLine size={16} className="text-emerald-400" />
                        <span>Table Scanner</span>
                    </button>

                    <button
                        onClick={handleAddClick}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shadow-sm cursor-pointer"
                    >
                        <Plus size={18} /> Add Table
                    </button>
                </div>
            </div>

            {/* Controls (only for Tables tab) */}
            {activeTab === 'tables' && (
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
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Click <strong>Table Scanner</strong> or any table's <strong>Scan QR</strong> to preview ordering.</span>
                    </div>
                </div>
            )}

            {/* QR Digital Menu Tab */}
            {activeTab === 'qr' && (
                <div className="space-y-6 min-w-0 pr-1.5 flex-1">
                    {loading ? (
                        <div className="flex justify-center p-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                    ) : tables.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center text-gray-500">
                            <QrCode size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-lg font-bold">No Tables Set Up</p>
                            <p className="text-sm mt-1">Go to <strong>Table Management</strong> to add tables first.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {tables.map((table) => (
                                <div key={table._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col p-5 space-y-4 hover:shadow-md transition-shadow items-center text-center">
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 w-full">
                                        <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Table {table.tableNumber}</p>
                                        <div className="bg-white p-2 rounded-lg mt-2 inline-block shadow-sm">
                                            <QRCodeSVG
                                                value={getQrUrl(table)}
                                                size={112}
                                                level="M"
                                                includeMargin={false}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 font-semibold flex items-center gap-1"><Store size={12} />{table.branchId?.name || 'Main Branch'}</p>
                                    <button
                                        onClick={() => openQrModal(table)}
                                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        <QrCode size={14} /> View Full QR
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tables Grid (only for Table Management tab) */}
            {activeTab === 'tables' && (
                loading ? (
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
                                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-green-500/10 cursor-pointer"
                                        title="View Table QR Code"
                                    >
                                        <QrCode size={14} /> View QR
                                    </button>
                                    <button
                                        onClick={() => {
                                            setScannedTable(table);
                                            setIsScannerOpen(true);
                                            setScannerMode('select');
                                        }}
                                        className="py-2.5 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                                        title="Test Scan Table"
                                    >
                                        <ScanLine size={14} className="text-emerald-400" />
                                        <span>Scan</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(table)}
                                        className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all border border-red-100 flex items-center justify-center cursor-pointer"
                                        title="Delete Table"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}

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
                                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="e.g. 4, 6"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                <select
                                    value={formData.branchId}
                                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsQrModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col p-4 sm:p-5 items-center text-center">
                        <button
                            onClick={() => setIsQrModalOpen(false)}
                            className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
                        >
                            <X size={18} />
                        </button>

                        <div className="bg-emerald-50/90 border border-emerald-100 rounded-2xl p-4 mt-0.5 mb-2.5 w-full flex flex-col items-center justify-center">
                            <h3 className="text-xl font-black text-emerald-800 tracking-wider">TABLE {selectedTable.tableNumber}</h3>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">FoodNest QR Ordering</p>

                            {/* Environment Switcher for Localhost / Phone Scanning, or Single Live Badge on Production */}
                            {isLocalhost ? (
                                <div className="flex items-center justify-center gap-1 mt-2.5 mb-2.5 p-1 bg-white/95 rounded-xl border border-emerald-200/80 shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => setQrMode('localhost')}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${qrMode === 'localhost' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
                                            }`}
                                        title="Direct localhost test URL for desktop browser"
                                    >
                                        Localhost:5174
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQrMode('network')}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${qrMode === 'network' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
                                            }`}
                                        title="Allows mobile phone on the same WiFi to scan and open"
                                    >
                                        WiFi / Phone
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQrMode('production')}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${qrMode === 'production' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
                                            }`}
                                        title="Live Vercel Production QR Menu"
                                    >
                                        Production
                                    </button>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-emerald-800 text-[11px] font-bold mt-2.5 mb-2.5 border border-emerald-200/80 shadow-2xs">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Live Table Menu Active
                                </div>
                            )}

                            <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-center mx-auto">
                                <QRCodeSVG
                                    id={`table-qr-svg-${selectedTable?._id || selectedTable?.tableNumber}`}
                                    value={getQrUrl(selectedTable)}
                                    size={156}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                        </div>

                        <p className="text-[11px] font-medium text-gray-500 mb-2.5 max-w-[270px]">
                            Point any camera to scan, or open directly below to test customer ordering.
                        </p>

                        <a
                            href={getQrUrl(selectedTable)}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 mb-2.5 cursor-pointer"
                        >
                            <span>Open Table Menu &amp; Order (Test)</span>
                            <ExternalLink size={13} />
                        </a>

                        <div className="w-full mb-3 text-left">
                            <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs flex items-center justify-between gap-2">
                                <span className="text-emerald-800 font-mono text-[10px] sm:text-[11px] truncate flex-1 select-all">
                                    {getQrUrl(selectedTable)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(getQrUrl(selectedTable));
                                        toast.success('Table ordering URL copied to clipboard!');
                                    }}
                                    className="text-[10px] sm:text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer shrink-0 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs hover:bg-emerald-50 transition-colors"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 w-full">
                            <button
                                onClick={handlePrintQr}
                                className="py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                <Printer size={14} /> Print Card
                            </button>
                            <button
                                onClick={handleDownloadQr}
                                className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-gray-200 cursor-pointer"
                            >
                                <Download size={14} /> Download
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LIVE TABLE SCANNER MODAL */}
            {isScannerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsScannerOpen(false)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                                    <ScanLine size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm sm:text-base leading-tight">Live Table QR Scanner</h3>
                                    <p className="text-[10px] text-slate-400">Scan physical table codes or test ordering instantly</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsScannerOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scanner Body */}
                        <div className="p-5 space-y-4">
                            {/* Mode Tabs */}
                            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setScannerMode('camera')}
                                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        scannerMode === 'camera' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <Camera size={14} />
                                    <span>Camera Scanner</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScannerMode('select')}
                                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        scannerMode === 'select' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <QrCode size={14} />
                                    <span>Select Table</span>
                                </button>
                            </div>

                            {/* Camera Viewport */}
                            {scannerMode === 'camera' && (
                                <div className="space-y-3">
                                    <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />
                                        
                                        {/* Scanning Crosshair Overlay */}
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                            <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                                {/* Corner Accent Markers */}
                                                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                                                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                                                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                                                
                                                {/* Animated Laser Scanning Line */}
                                                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse absolute top-1/2 -translate-y-1/2" />
                                            </div>
                                        </div>

                                        {!cameraActive && (
                                            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center text-white space-y-2">
                                                <Camera size={32} className="text-slate-500 animate-bounce" />
                                                <p className="text-xs font-semibold text-slate-300">
                                                    {cameraError || 'Starting camera sensor...'}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={startCamera}
                                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                                                >
                                                    Enable Camera
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-center text-slate-500 font-medium">
                                        Align table QR code within the frame to scan automatically, or choose a table below:
                                    </p>
                                </div>
                            )}

                            {/* Quick Table Selector */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Quick Select Table to Test Scan
                                </label>
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
                                    {tables.map(tbl => {
                                        const isSelected = scannedTable?._id === tbl._id;
                                        return (
                                            <button
                                                key={tbl._id}
                                                type="button"
                                                onClick={() => setScannedTable(tbl)}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                Table {tbl.tableNumber}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Scanned Result Card */}
                            {scannedTable && (
                                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-emerald-600" />
                                            <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                                                Table {scannedTable.tableNumber} Connected
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            {scannedTable.capacity} Seats · {scannedTable.status}
                                        </span>
                                    </div>

                                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-slate-700 font-mono text-[10px] sm:text-[11px] truncate select-all">
                                        {getQrUrl(scannedTable)}
                                    </div>

                                    <div className="flex gap-2">
                                        <a
                                            href={getQrUrl(scannedTable)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <ExternalLink size={14} />
                                            <span>Open Live Table Menu</span>
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(getQrUrl(scannedTable));
                                                toast.success(`Table ${scannedTable.tableNumber} ordering link copied!`);
                                            }}
                                            className="px-3.5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                        >
                                            Copy Link
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablesManagement;