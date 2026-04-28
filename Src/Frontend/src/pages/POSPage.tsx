// @ts-nocheck
import {
    ArrowLeft, Banknote,
    CheckCircle2,
    CreditCard, Minus,
    Package, Plus, Search, ShoppingCart,
    Smartphone,
    Trash2,
    User
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { usePermission } from '../components/PermissionContext';
import { loadAuthSession } from '../utils/authStorage';
import {
    createExportReceiptApi,
    getCustomersApi,
    getSaleProductsApi,
} from '../utils/backendApi';
import { getProductImageSrc } from '../utils/productImage';

const VND = new Intl.NumberFormat('vi-VN');

// --- Components nhỏ để code sạch hơn ---

const ProductCard = ({ product, inCart, addToCart, isMaxed }) => {
    const stock = Number(product.SOLUONG || 0);
    const imgSrc = getProductImageSrc(product.HINHANH || '', product.TEN || '', product.THUONGHIEU || '');

    return (
        <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={isMaxed}
            className={`group relative flex flex-col h-full rounded-2xl border p-3 text-left transition-all duration-300
        ${inCart > 0
                    ? 'border-amber-500 bg-amber-50/50 shadow-md ring-1 ring-amber-500/20'
                    : 'border-gray-100 bg-white hover:border-amber-300 hover:shadow-xl hover:-translate-y-1'
                }
        ${isMaxed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
        >
            {inCart > 0 && (
                <div className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold shadow-lg animate-in zoom-in">
                    {inCart}
                </div>
            )}

            <div className="w-full aspect-square mb-3 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                {imgSrc ? (
                    <img src={imgSrc} alt={product.TEN} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                ) : (
                    <div className="text-xs font-bold text-gray-300 uppercase">{product.THUONGHIEU}</div>
                )}
            </div>

            <div className="flex flex-col flex-1">
                <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-wider mb-1">
                    {product.THUONGHIEU || 'No Brand'}
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                    SP{product.MSP}
                </span>
                <h3 className="text-sm font-semibold text-gray-800 leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                    {product.TEN}
                </h3>

                <div className="mt-auto flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">
                        {VND.format(Number(product.GIABAN || 0))}đ
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stock <= 3 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                        Tồn: {stock}
                    </span>
                </div>
            </div>
        </button>
    );
};

export function POSPage({ onBack }) {
    const { can } = usePermission();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [mkh, setMkh] = useState('');
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [confirmModal, setConfirmModal] = useState(null); // { type: 'remove'|'clearAll', msp?, productName? }
    const [stockWarning, setStockWarning] = useState(null); // { msp, max }

    // Load Initial Data
    useEffect(() => {
        (async () => {
            try {
                const [customerRows, productRows] = await Promise.all([
                    getCustomersApi().catch(() => []),
                    can('sanpham', 'view') ? getSaleProductsApi().catch(() => []) : Promise.resolve([]),
                ]);
                setCustomers(customerRows.filter(x => Number(x.TT) === 1));
                setProducts(productRows.filter(x => Number(x.TT) === 1 && Number(x.SOLUONG || 0) > 0));
            } catch (e) {
                setError('Không thể kết nối máy chủ');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Logic xử lý khách hàng mặc định
    const orderedCustomers = useMemo(() => {
        const list = [...customers];
        const idx = list.findIndex(c => c.HOTEN?.toLowerCase().includes('mặc định'));
        if (idx > -1) {
            const [def] = list.splice(idx, 1);
            return [def, ...list];
        }
        return list;
    }, [customers]);

    useEffect(() => {
        if (orderedCustomers.length > 0 && !mkh) setMkh(Number(orderedCustomers[0].MKH));
    }, [orderedCustomers, mkh]);

    const brands = useMemo(() =>
        Array.from(new Set(products.map(p => p.THUONGHIEU?.trim()).filter(Boolean))).sort()
        , [products]);

    const filteredProducts = useMemo(() => {
        const q = search.toLowerCase().trim();
        return products.filter(p => {
            const matchSearch = !q || p.MSP.toString().includes(q) || p.TEN?.toLowerCase().includes(q);
            const matchBrand = !selectedBrand || p.THUONGHIEU === selectedBrand;
            return matchSearch && matchBrand;
        });
    }, [products, search, selectedBrand]);

    // Cart Actions
    const addToCart = (product) => {
        setCart(prev => {
            const item = prev.find(c => c.product.MSP === product.MSP);
            if (item) {
                if (item.qty >= product.SOLUONG) return prev;
                return prev.map(c => c.product.MSP === product.MSP ? { ...c, qty: c.qty + 1 } : c);
            }
            return [...prev, { product, qty: 1 }];
        });
    };

    const updateQty = (msp, delta) => {
        setCart(prev => prev.map(c => {
            if (c.product.MSP === msp) {
                const newQty = c.qty + delta;
                if (newQty < 1) return c;
                if (newQty > c.product.SOLUONG) return c;
                return { ...c, qty: newQty };
            }
            return c;
        }));
    };

    const setQtyDirect = (msp, value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1) return;
        setCart(prev => prev.map(c => {
            if (c.product.MSP === msp) {
                if (num > c.product.SOLUONG) {
                    setStockWarning({ msp, max: c.product.SOLUONG });
                    return { ...c, qty: c.product.SOLUONG };
                }
                return { ...c, qty: num };
            }
            return c;
        }));
    };

    // Hàm xóa sản phẩm — dùng modal
    const removeFromCart = (msp) => {
        setCart(prev => prev.filter(c => c.product.MSP !== msp));
        setConfirmModal(null);
    };

    // Hàm xóa tất cả — dùng modal
    const clearCart = () => {
        setCart([]);
        setConfirmModal(null);
    };

    const total = useMemo(() => cart.reduce((sum, c) => sum + c.qty * c.product.GIABAN, 0), [cart]);

    const handlePayment = async () => {
        if (cart.length === 0) return;
        setSaving(true);
        try {
            const session = loadAuthSession();
            await createExportReceiptApi({
                mnv: session?.mnv,
                mkh: Number(mkh),
                items: cart.map(c => ({
                    msp: c.product.MSP,
                    sl: c.qty,
                    tienXuat: c.product.GIABAN,
                })),
            });

            // Reset state
            setCart([]);
            setToast('Thanh toán hoàn tất!');
            setTimeout(() => setToast(''), 3000);

            // Refresh stock
            const updated = await getSaleProductsApi();
            setProducts(updated.filter(x => Number(x.TT) === 1 && Number(x.SOLUONG || 0) > 0));
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex h-full items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-.3s]" />
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-.5s]" />
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* --- Top Navbar --- */}
            <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <nav className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-gray-400">Bán hàng /</span>
                        <span className="text-amber-600">POS Cửa hàng</span>
                    </nav>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden">
                {/* --- Cột Trái: Sản phẩm --- */}
                <section className="flex-1 flex flex-col bg-white overflow-hidden border-r border-gray-100">
                    {/* Tìm kiếm & Brand */}
                    <div className="p-5 space-y-4 border-b border-gray-50">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm tên đồng hồ hoặc mã số..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500/20 text-sm transition-all"
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-3 [&::-webkit-scrollbar]:h-[5px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100">
                            <button
                                onClick={() => setSelectedBrand('')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                  ${!selectedBrand ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                            >
                                Tất cả
                            </button>
                            {brands.map(b => (
                                <button
                                    key={b}
                                    onClick={() => setSelectedBrand(b)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                    ${selectedBrand === b ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid sản phẩm */}
                    <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 auto-rows-[280px] gap-4 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
                        {filteredProducts.map(p => (
                            <ProductCard
                                key={p.MSP}
                                product={p}
                                inCart={cart.find(c => c.product.MSP === p.MSP)?.qty || 0}
                                addToCart={addToCart}
                                isMaxed={cart.find(c => c.product.MSP === p.MSP)?.qty >= p.SOLUONG}
                            />
                        ))}
                    </div>
                </section>

                {/* --- Cột Phải: Giỏ hàng --- */}
                <aside className="w-[400px] flex flex-col bg-white overflow-hidden">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 font-black text-gray-800">
                            <ShoppingCart className="w-5 h-5 text-amber-500" />
                            Đơn hàng hiện tại
                        </h2>
                        {/* Nút xóa tất cả */}
                        {cart.length > 0 && (
                            <button
                                onClick={() => setConfirmModal({ type: 'clearAll' })}
                                className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-3 h-3" />
                                Xóa tất cả
                            </button>
                        )}
                    </div>

                    {/* Chọn khách hàng */}
                    <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            <User className="w-3.5 h-3.5" /> Khách hàng
                        </label>
                        <select
                            value={mkh}
                            onChange={(e) => setMkh(e.target.value ? Number(e.target.value) : '')}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
                        >
                            {orderedCustomers.map((c) => (
                                <option key={c.MKH} value={c.MKH}>
                                    {c.HOTEN} {c.SDT ? `(${c.SDT})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* List items */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-gray-200 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20">
                                <Package className="w-16 h-16 mb-2" />
                                <p className="font-bold">Giỏ hàng trống</p>
                            </div>
                        ) : (
                            cart.map(({ product, qty }) => (
                                <div key={product.MSP} className="flex gap-3 py-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                                        <img src={getProductImageSrc(product.HINHANH, product.TEN, product.THUONGHIEU)} className="w-12 h-12 object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-xs font-bold text-gray-800 truncate pr-2 flex-1">{product.TEN}</h4>
                                            <button
                                                onClick={() => setConfirmModal({
                                                    type: 'remove',
                                                    msp: product.MSP,
                                                    productName: product.TEN
                                                })}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs font-bold text-amber-600 mb-2">{VND.format(product.GIABAN)}đ</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
                                                <button onClick={() => updateQty(product.MSP, -1)} className="p-1 hover:bg-white rounded-md transition-colors"><Minus className="w-3 h-3" /></button>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={product.SOLUONG}
                                                    value={qty}
                                                    onChange={(e) => setQtyDirect(product.MSP, e.target.value)}
                                                    className="w-10 text-center text-xs font-black bg-transparent focus:outline-none focus:bg-white rounded focus:ring-1 focus:ring-amber-400/40 py-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                />
                                                <button onClick={() => updateQty(product.MSP, 1)} className="p-1 hover:bg-white rounded-md transition-colors"><Plus className="w-3 h-3" /></button>
                                            </div>
                                            <span className="text-sm font-black text-gray-900">{VND.format(qty * product.GIABAN)}đ</span>
                                        </div>
                                        {stockWarning?.msp === product.MSP && (
                                            <p className="text-[10px] text-red-500 font-medium mt-1">
                                                Tối đa {stockWarning.max} sản phẩm trong kho
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer thanh toán */}
                    <div className="p-5 bg-gray-50 border-t border-gray-100 space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-medium text-gray-500">Tổng thanh toán</span>
                            {/* Số tiền màu đỏ như đã yêu cầu trước đó */}
                            <span className="text-2xl font-black text-red-600 tracking-tighter">{VND.format(total)}đ</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'cash', icon: <Banknote />, label: 'Tiền mặt' },
                                { id: 'transfer', icon: <Smartphone />, label: 'Chuyển khoản' },
                                { id: 'card', icon: <CreditCard />, label: 'Thẻ' },
                            ].map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id)}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all
                    ${paymentMethod === method.id ? 'border-amber-500 bg-white text-amber-600' : 'border-transparent text-gray-400 hover:bg-gray-200'}`}
                                >
                                    {method.icon}
                                    <span className="text-[10px] font-bold">{method.label}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={cart.length === 0 || saving}
                            onClick={handlePayment}
                            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-gray-200 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {saving ? 'Đang xử lý...' : 'Thanh toán'}
                        </button>
                    </div>
                </aside>
            </main>

            {/* Toast thông báo */}
            {toast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold">{toast}</span>
                </div>
            )}
            <DeleteConfirmModal
                deleteConfirm={confirmModal}
                setDeleteConfirm={setConfirmModal}
                confirmDelete={() => {
                    if (confirmModal?.type === 'remove') {
                        removeFromCart(confirmModal.msp);
                    } else if (confirmModal?.type === 'clearAll') {
                        clearCart();
                    }
                }}
            />
        </div>
    );
}