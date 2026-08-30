'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Building2, CheckCircle2, LayoutDashboard, LogOut, Package, Pencil,
  Plus, ShieldCheck, ShoppingBag, Store, Trash2, Users, XCircle, Clock,
  Save, X as XIcon,
} from 'lucide-react';
import { Button }       from '@/components/ui/Button';
import { Card }         from '@/components/ui/Card';
import { Input }        from '@/components/ui/Input';
import { Badge }        from '@/components/ui/Badge';
import { toast }        from '@/components/ui/Toast';
import { GlobalLayout }  from '@/components/layout/GlobalLayout';
import { useAuth }      from '@/lib/providers/AuthProvider';
import { api }          from '@/lib/api';
import { formatINR }    from '@/utils/format';

// ─── Backend Types ─────────────────────────────────────────────────────────────
type BackendProduct = {
  id: number; name: string; slug: string; sku: string;
  price: string; discount_price: string | null; final_price: string;
  stock: number; status: string;
  short_description: string; description: string;
  images: Array<{ image: string; alt_text: string }>;
};
type ProductResponse = { count: number; results: BackendProduct[] };

type BackendOrderItem = {
  id: number; product: number; product_name: string; vendor: number;
  vendor_name: string; quantity: number; unit_price: string; total_price: string;
};
type BackendOrder = {
  id: number; order_number: string; total_amount: string;
  status: string; created_at: string; full_name: string;
  phone: string; city: string; state: string;
  items: BackendOrderItem[];
};
type OrderResponse = { count: number; results: BackendOrder[] };

type VendorProfile = {
  id: number; email: string; name: string; business_name: string;
  business_address: string; city: string; state: string; pincode: string;
  gstin: string; description: string; website: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejection_reason: string; created_at: string; updated_at: string;
};
type VendorProfileList = { count: number; results: VendorProfile[] };

// ─── Token helper ──────────────────────────────────────────────────────────────
const token = () =>
  typeof window === 'undefined' ? '' : localStorage.getItem('electrohub_access_token') ?? '';

// ─── Vendor Guard ──────────────────────────────────────────────────────────────
function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const allowed = isLoggedIn && user?.role === 'vendor';
  React.useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
    else if (user?.role !== 'vendor') router.replace('/');
  }, [isLoggedIn, router, user?.role]);
  if (!allowed) return (
    <GlobalLayout>
      <div className="container-fluid py-24 text-center">
        <ShieldCheck className="mx-auto mb-4 text-[var(--primary)]" size={36} />
        <h1 className="text-2xl font-bold text-[var(--text)]">Vendor access required</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Please log in with a vendor account.</p>
      </div>
    </GlobalLayout>
  );
  return <>{children}</>;
}

// ─── Admin Guard ───────────────────────────────────────────────────────────────
function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const isAdmin = isLoggedIn && user?.role === 'admin';
  React.useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
    else if (!isAdmin) router.replace('/');
  }, [isAdmin, isLoggedIn, router]);
  if (!isAdmin) return (
    <GlobalLayout>
      <div className="container-fluid py-24 text-center">
        <ShieldCheck className="mx-auto mb-4 text-[var(--primary)]" size={36} />
        <h1 className="text-2xl font-bold text-[var(--text)]">Admin access required</h1>
      </div>
    </GlobalLayout>
  );
  return <>{children}</>;
}

// ─── Vendor Shell ──────────────────────────────────────────────────────────────
function Shell({ children, active }: { children: React.ReactNode; active: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const links = [
    ['Dashboard',        '/vendor/dashboard',       LayoutDashboard],
    ['My Products',      '/vendor/products',        Package],
    ['Add Product',      '/vendor/products/add',    Plus],
    ['Orders',           '/vendor/orders',          ShoppingBag],
    ['Business Profile', '/vendor/profile',         Building2],
  ] as const;
  return (
    <GlobalLayout>
      <div className="container-fluid py-8">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Marketplace workspace</p>
            <h1 className="mt-1 text-2xl font-bold font-display text-[var(--text)]">
              {active === 'Dashboard' ? `Welcome, ${user?.name?.split(' ')[0] ?? 'Vendor'}` : active}
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { logout(); router.push('/login'); }} leftIcon={<LogOut size={14} />}>Logout</Button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-3">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-[var(--surface)] p-3">
              <Store size={18} className="text-[var(--primary)]" />
              <p className="text-sm font-semibold text-[var(--text)]">Vendor workspace</p>
            </div>
            <nav className="space-y-1">
              {links.map(([label, href, Icon]) => (
                <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active === label ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'}`}>
                  <Icon size={15} />{label}
                </Link>
              ))}
            </nav>
          </aside>
          <main>{children}</main>
        </div>
      </div>
    </GlobalLayout>
  );
}

// ─── Vendor Data Hook ──────────────────────────────────────────────────────────
// Single shared hook. Components that need the data should receive it as props
// from the parent that calls this hook — avoids duplicate fetches.
function useVendorData() {
  const [products, setProducts] = React.useState<BackendProduct[]>([]);
  const [orders,   setOrders]   = React.useState<BackendOrder[]>([]);
  const [profile,  setProfile]  = React.useState<VendorProfile | null>(null);
  const [loading,  setLoading]  = React.useState(true);
  const [error,    setError]    = React.useState('');

  const reload = React.useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<ProductResponse>('/products/vendor/', { token: token() }),
      api.get<OrderResponse>('/orders/vendor/',     { token: token() }),
      api.get<VendorProfile>('/vendor/profile/',    { token: token() }),
    ]).then(([p, o, vp]) => {
      setProducts(Array.isArray(p) ? p : (p.results ?? []));
      setOrders(Array.isArray(o) ? o : (o.results ?? []));
      setProfile(vp);
    }).catch((e) => setError(e instanceof Error ? e.message : 'Unable to load vendor data.'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { reload(); }, [reload]);

  return { products, orders, profile, error, loading, setProducts, setOrders, setProfile, reload };
}

// ─── Approval Status Banner ────────────────────────────────────────────────────
function ApprovalBanner({ status, reason }: { status: string; reason?: string }) {
  if (status === 'approved') return null;
  const configs = {
    pending:   { color: 'bg-amber-50 border-amber-200 text-amber-800',   icon: <Clock size={16} />,      msg: 'Your vendor application is pending admin review. You will be able to manage products once approved.' },
    rejected:  { color: 'bg-red-50 border-red-200 text-red-800',         icon: <XCircle size={16} />,    msg: `Your application was rejected. ${reason ? `Reason: ${reason}` : 'Please contact support.'}` },
    suspended: { color: 'bg-orange-50 border-orange-200 text-orange-800', icon: <ShieldCheck size={16} />, msg: 'Your vendor account has been suspended. Please contact support.' },
  };
  const cfg = configs[status as keyof typeof configs];
  if (!cfg) return null;
  return (
    <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${cfg.color}`}>
      {cfg.icon}
      <p className="text-sm font-medium">{cfg.msg}</p>
    </div>
  );
}

// ─── Real Vendor Dashboard ─────────────────────────────────────────────────────
export function RealVendorDashboard() {
  const { products, orders, profile, error, loading } = useVendorData();
  const stats: Array<{ label: string; value: string | number; icon: React.ElementType }> = [
    { label: 'Total Products',  value: products.length,                                                    icon: Package      },
    { label: 'Active Products', value: products.filter((p) => p.status === 'active').length,               icon: CheckCircle2 },
    { label: 'Orders',          value: orders.length,                                                      icon: ShoppingBag  },
    { label: 'Total Sales',     value: formatINR(orders.reduce((s, o) => s + Number(o.total_amount), 0)),  icon: ShoppingBag  },
  ];
  return (
    <Guard>
      <Shell active="Dashboard">
        {profile && <ApprovalBanner status={profile.status} reason={profile.rejection_reason} />}
        {error && <p className="mb-5 text-sm text-[var(--danger)]">{error}</p>}
        {loading && <p className="mb-5 text-sm text-[var(--text-muted)]">Loading…</p>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-5">
              <Icon size={18} className="text-[var(--primary)]" />
              <p className="mt-4 text-sm text-[var(--text-muted)]">{label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text)]">{value}</p>
            </Card>
          ))}
        </div>
        {orders.length > 0 && (
          <Card className="mt-6 overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-[var(--text)]">Recent Orders</h2>
              <Link href="/vendor/orders" className="text-xs text-[var(--primary)] hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {orders.slice(0, 3).map((o) => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-sm text-[var(--text)]">Order #{o.order_number}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(o.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <Badge variant={o.status === 'completed' ? 'success' : o.status === 'pending' ? 'warning' : 'info'}>{o.status}</Badge>
                  <span className="font-semibold text-sm text-[var(--text)]">{formatINR(Number(o.total_amount))}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Shell>
    </Guard>
  );
}

// ─── Real Vendor Products (parent — owns data) ─────────────────────────────────
export function RealVendorProducts({ add = false }: { add?: boolean }) {
  const data = useVendorData();
  return (
    <Guard>
      <Shell active={add ? 'Add Product' : 'My Products'}>
        {add
          ? <RealAddProduct onCreated={data.reload} />
          : <RealProductList
              products={data.products}
              profile={data.profile}
              error={data.error}
              loading={data.loading}
              setProducts={data.setProducts}
              reload={data.reload}
            />
        }
      </Shell>
    </Guard>
  );
}

// ─── Inline Edit Form ──────────────────────────────────────────────────────────
interface EditForm {
  name: string; price: string; discount_price: string;
  stock: string; status: string; short_description: string;
}

function InlineEditForm({
  product,
  onSave,
  onCancel,
}: {
  product: BackendProduct;
  onSave: (updated: BackendProduct) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditForm>({
    defaultValues: {
      name:              product.name,
      price:             product.price,
      discount_price:    product.discount_price ?? product.price,
      stock:             String(product.stock),
      status:            product.status,
      short_description: product.short_description,
    },
  });

  const submit = async (data: EditForm) => {
    try {
      const updated = await api.patch<BackendProduct>(
        `/products/${product.slug}/`,
        {
          name:              data.name,
          price:             data.price,
          discount_price:    data.discount_price || null,
          stock:             parseInt(data.stock, 10),
          status:            data.status,
          short_description: data.short_description,
        },
        { token: token() },
      );
      onSave(updated);
      toast.success('Product updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to update product.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="border border-[var(--primary)]/30 rounded-xl bg-[var(--background-alt)] p-4 mt-2 space-y-3"
    >
      <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-3">Editing: {product.name}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Input label="Product Name" {...register('name', { required: 'Required' })} error={errors.name?.message} />
        </div>
        <Input label="Price (₹)" type="number" step="0.01" {...register('price', { required: 'Required' })} error={errors.price?.message} />
        <Input label="Discount Price (₹)" type="number" step="0.01" placeholder="Leave blank for no discount" {...register('discount_price')} />
        <Input label="Stock" type="number" {...register('stock', { required: 'Required', min: { value: 0, message: 'Cannot be negative' } })} error={errors.stock?.message} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text)]">Status</label>
          <select
            {...register('status')}
            className="w-full h-10 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Input label="Short Description" {...register('short_description')} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<Save size={13} />}>Save Changes</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} leftIcon={<XIcon size={13} />}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Product List ──────────────────────────────────────────────────────────────
function RealProductList({
  products,
  profile,
  error,
  loading,
  setProducts,
  reload,
}: {
  products: BackendProduct[];
  profile: VendorProfile | null;
  error: string;
  loading: boolean;
  setProducts: React.Dispatch<React.SetStateAction<BackendProduct[]>>;
  reload: () => void;
}) {
  const [editingId, setEditingId] = React.useState<number | null>(null);

  const remove = async (product: BackendProduct) => {
    if (!confirm(`Deactivate "${product.name}"?`)) return;
    try {
      await api.delete(`/products/${product.slug}/`, { token: token() });
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success('Product deactivated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to deactivate product.');
    }
  };

  const handleSaved = (updated: BackendProduct) => {
    setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    setEditingId(null);
  };

  return (
    <div>
      {profile && profile.status !== 'approved' && (
        <ApprovalBanner status={profile.status} reason={profile.rejection_reason} />
      )}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">My Products</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Loaded from the Django catalogue.</p>
        </div>
        <Link href="/vendor/products/add">
          <Button size="sm" leftIcon={<Plus size={14} />}>Add Product</Button>
        </Link>
      </div>
      {error && <p className="mb-4 text-sm text-[var(--danger)]">{error}</p>}
      {loading && <p className="mb-4 text-sm text-[var(--text-muted)]">Loading products…</p>}
      <Card className="overflow-hidden">
        {products.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--text-muted)]">No products yet. Add your first product.</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {products.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <img
                    src={p.images[0]?.image ?? '/favicon.ico'}
                    alt={p.images[0]?.alt_text ?? p.name}
                    className="h-14 w-14 rounded-lg bg-[var(--background-alt)] object-contain p-1"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.ico'; }}
                  />
                  <div className="min-w-[180px] flex-1">
                    <p className="font-semibold text-[var(--text)]">{p.name}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">SKU: {p.sku}</p>
                  </div>
                  <span className="font-semibold text-[var(--text)]">{formatINR(Number(p.final_price))}</span>
                  <span className="text-sm text-[var(--text-muted)]">Stock: {p.stock}</span>
                  <Badge variant={p.status === 'active' ? 'success' : 'default'}>{p.status}</Badge>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                      className="text-[var(--primary)] hover:opacity-70 transition-opacity"
                      title="Edit product"
                      aria-label={`Edit ${p.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => remove(p)}
                      className="text-[var(--danger)] hover:opacity-70 transition-opacity"
                      title="Deactivate product"
                      aria-label={`Deactivate ${p.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {editingId === p.id && (
                  <InlineEditForm
                    product={p}
                    onSave={handleSaved}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Add Product Form ──────────────────────────────────────────────────────────
interface AddForm {
  name: string; sku: string; price: string; discount_price: string;
  stock: string; short_description: string; description: string;
  category_id: string; brand_id: string;
}

const CATEGORY_OPTIONS = [
  { value: '1', label: 'Arduino' },
  { value: '2', label: 'Raspberry Pi' },
  { value: '3', label: 'ESP32 / ESP8266' },
  { value: '4', label: 'Sensors' },
  { value: '5', label: 'Motors & Actuators' },
  { value: '6', label: 'Displays' },
];

const BRAND_OPTIONS = [
  { value: '1', label: 'Arduino' },
  { value: '2', label: 'Raspberry Pi Foundation' },
  { value: '3', label: 'Espressif' },
  { value: '4', label: 'Generic' },
];

function RealAddProduct({ onCreated }: { onCreated?: () => void }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AddForm>({
    defaultValues: { category_id: '1', brand_id: '4' },
  });

  const submit = async (data: AddForm) => {
    try {
      // Generate a URL-safe slug from name + random suffix
      const base = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`;
      await api.post('/products/', {
        name:              data.name,
        sku:               data.sku,
        slug,
        price:             data.price,
        discount_price:    data.discount_price || null,
        stock:             parseInt(data.stock, 10),
        short_description: data.short_description,
        description:       data.description,
        category_id:       data.category_id ? parseInt(data.category_id, 10) : null,
        brand_id:          data.brand_id ? parseInt(data.brand_id, 10) : null,
        status:            'active',
        is_active:         true,
      }, { token: token() });
      toast.success('Product saved to Django');
      onCreated?.();
      router.push('/vendor/products');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to save product.');
    }
  };

  return (
    <Card className="max-w-3xl p-6">
      <h2 className="text-xl font-bold text-[var(--text)]">Add Product</h2>
      <p className="mt-1 mb-6 text-sm text-[var(--text-muted)]">
        This product will be saved to the Django database and appear in the shop once active.
      </p>
      <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Product Name" required error={errors.name?.message}
            {...register('name', { required: 'Product name is required' })} />
        </div>
        <Input label="SKU" required placeholder="EH-MY-SKU-001" error={errors.sku?.message}
          {...register('sku', { required: 'SKU is required' })} />
        <Input label="Stock Quantity" type="number" required error={errors.stock?.message}
          {...register('stock', { required: 'Stock is required', min: { value: 0, message: 'Cannot be negative' } })} />
        <Input label="Price (₹)" type="number" step="0.01" required error={errors.price?.message}
          {...register('price', { required: 'Price is required' })} />
        <Input label="Discount Price (₹)" type="number" step="0.01" placeholder="Leave blank for no discount"
          {...register('discount_price')} />

        {/* Category dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text)]">Category</label>
          <select
            {...register('category_id')}
            className="w-full h-10 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Brand dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text)]">Brand</label>
          <select
            {...register('brand_id')}
            className="w-full h-10 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none"
          >
            {BRAND_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

        <Input label="Short Description" placeholder="Brief product summary (1–2 sentences)"
          {...register('short_description')} />
        <div className="sm:col-span-2">
          <Input label="Full Description" placeholder="Detailed product description"
            {...register('description')} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" isLoading={isSubmitting} leftIcon={<Plus size={15} />}>Save Product to Django</Button>
        </div>
      </form>
    </Card>
  );
}

// ─── Real Vendor Orders ────────────────────────────────────────────────────────
export function RealVendorOrders() {
  const { orders, error, loading, setOrders } = useVendorData();

  return (
    <Guard>
      <Shell active="Orders">
        <h2 className="mb-5 text-xl font-bold text-[var(--text)]">Orders</h2>
        <p className="mb-5 text-sm text-[var(--text-muted)]">
          Only orders containing your products are shown. You can only see your own line items.
        </p>
        {error && <p className="mb-4 text-sm text-[var(--danger)]">{error}</p>}
        {loading && <p className="mb-4 text-sm text-[var(--text-muted)]">Loading orders…</p>}
        <Card className="overflow-hidden">
          {orders.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--text-muted)]">
              No orders yet. Orders will appear here when customers purchase your products.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {orders.map((o) => (
                <div key={o.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--text)]">Order #{o.order_number}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(o.created_at).toLocaleDateString('en-IN')} · {o.full_name} · {o.city}
                      </p>
                    </div>
                    {/* Status selector — vendor updates order status */}
                    <select
                      value={o.status}
                      onChange={async (event) => {
                        const prev = o.status;
                        try {
                          const updated = await api.patch<BackendOrder>(
                            `/orders/vendor/${o.id}/status/`,
                            { status: event.target.value },
                            { token: token() },
                          );
                          setOrders((current) =>
                            current.map((order) => order.id === o.id ? updated : order),
                          );
                          toast.success(`Status updated to "${event.target.value}"`);
                        } catch (statusError) {
                          toast.error(statusError instanceof Error ? statusError.message : 'Unable to update order status.');
                          // Revert UI to previous value
                          setOrders((current) =>
                            current.map((order) =>
                              order.id === o.id ? { ...order, status: prev } : order,
                            ),
                          );
                        }
                      }}
                      className="rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-2 py-1.5 text-xs text-[var(--text)] cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <span className="font-semibold text-sm text-[var(--text)]">
                      {formatINR(Number(o.total_amount))}
                    </span>
                  </div>
                  {/* Show only this vendor's items (backend already filters) */}
                  <div className="mt-3 space-y-1.5 pl-1 border-l-2 border-[var(--primary)]/20">
                    {o.items.map((item, index) => (
                      <p key={`${o.id}-${index}`} className="text-sm text-[var(--text-muted)]">
                        <span className="font-medium text-[var(--text)]">{item.product_name}</span>
                        {' '}× {item.quantity}
                        {' '}· {formatINR(Number(item.total_price))}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Shell>
    </Guard>
  );
}

// ─── Real Vendor Profile ───────────────────────────────────────────────────────
export function RealVendorProfile() {
  const { profile, setProfile } = useVendorData();

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    try {
      const updated = await api.patch<VendorProfile>('/vendor/profile/', body, { token: token() });
      setProfile(updated);
      toast.success('Business profile updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to save profile.');
    }
  };

  if (!profile) return (
    <Guard>
      <Shell active="Business Profile">
        <div className="py-24 text-center text-sm text-[var(--text-muted)]">Loading business profile…</div>
      </Shell>
    </Guard>
  );

  return (
    <Guard>
      <Shell active="Business Profile">
        {profile.status !== 'approved' && (
          <ApprovalBanner status={profile.status} reason={profile.rejection_reason} />
        )}
        <Card className="max-w-3xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">Business Profile</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Your vendor status is <strong className={profile.status === 'approved' ? 'text-green-600' : 'text-amber-600'}>{profile.status}</strong>.
              </p>
            </div>
            <Badge variant={profile.status === 'approved' ? 'success' : profile.status === 'rejected' ? 'danger' : 'warning'}>
              {profile.status}
            </Badge>
          </div>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {([
              ['business_name',    'Business Name'],
              ['business_address', 'Business Address'],
              ['city',             'City'],
              ['state',            'State'],
              ['pincode',          'Pincode'],
              ['gstin',            'GSTIN'],
              ['website',          'Website'],
              ['description',      'Description'],
            ] as const).map(([field, label]) => (
              <Input
                key={field}
                label={label}
                name={field}
                defaultValue={profile[field] ?? ''}
              />
            ))}
            <div className="sm:col-span-2">
              <Button type="submit" leftIcon={<Pencil size={14} />}>Save Profile</Button>
            </div>
          </form>
        </Card>
      </Shell>
    </Guard>
  );
}

// ─── Real Admin Vendors ────────────────────────────────────────────────────────
export function RealAdminVendors() {
  const [vendors,  setVendors]  = React.useState<VendorProfile[]>([]);
  const [error,    setError]    = React.useState('');
  const [loading,  setLoading]  = React.useState(true);
  const [reason,   setReason]   = React.useState('');

  React.useEffect(() => {
    api.get<VendorProfileList | VendorProfile[]>('/admin/vendors/', { token: token() })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as VendorProfileList).results ?? [];
        setVendors(list);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load vendors.'))
      .finally(() => setLoading(false));
  }, []);

  const action = async (id: number, act: 'approve' | 'reject' | 'suspend') => {
    try {
      const body = act === 'reject' ? { reason: reason || 'Does not meet marketplace requirements.' } : {};
      const updated = await api.patch<VendorProfile>(`/admin/vendors/${id}/${act}/`, body, { token: token() });
      setVendors((current) => current.map((v) => v.id === id ? updated : v));
      toast.success(`Vendor ${act}d successfully`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Unable to ${act} vendor.`);
    }
  };

  return (
    <AdminGuard>
      <GlobalLayout>
        <div className="container-fluid py-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Administration</p>
            <h1 className="mt-1 text-2xl font-bold font-display text-[var(--text)]">Vendor Management</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Approve, reject, or suspend vendor applications.</p>
          </div>

          {error && <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="py-24 text-center text-sm text-[var(--text-muted)]">Loading vendor data from Django…</div>
          ) : vendors.length === 0 ? (
            <div className="py-24 text-center text-sm text-[var(--text-muted)]">No vendor applications yet.</div>
          ) : (
            <Card className="overflow-hidden">
              <div className="divide-y divide-[var(--border)]">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="p-5">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                        <Users size={17} />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <p className="font-semibold text-[var(--text)]">{vendor.business_name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{vendor.email} · {vendor.city}, {vendor.state}</p>
                        {vendor.gstin && <p className="text-xs text-[var(--text-muted)]">GSTIN: {vendor.gstin}</p>}
                        {vendor.description && <p className="mt-1 text-xs text-[var(--text-muted)]">{vendor.description}</p>}
                        {vendor.rejection_reason && (
                          <p className="mt-1 text-xs text-red-600">Rejection reason: {vendor.rejection_reason}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={
                          vendor.status === 'approved'  ? 'success' :
                          vendor.status === 'rejected'  ? 'danger'  :
                          vendor.status === 'suspended' ? 'warning' : 'default'
                        }>
                          {vendor.status}
                        </Badge>
                        {vendor.status !== 'approved' && (
                          <Button size="sm" onClick={() => action(vendor.id, 'approve')} leftIcon={<CheckCircle2 size={13} />}>
                            Approve
                          </Button>
                        )}
                        {vendor.status !== 'rejected' && (
                          <Button size="sm" variant="secondary" onClick={() => action(vendor.id, 'reject')} leftIcon={<XCircle size={13} />}>
                            Reject
                          </Button>
                        )}
                        {vendor.status === 'approved' && (
                          <Button size="sm" variant="ghost" onClick={() => action(vendor.id, 'suspend')}>
                            Suspend
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </GlobalLayout>
    </AdminGuard>
  );
}
