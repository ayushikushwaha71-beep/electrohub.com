'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Home,
  Briefcase,
  MoreHorizontal,
  Check,
  Phone,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/lib/providers/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import type { AddressType } from '@/types';
import {
  getStoredAddresses,
  saveAddresses,
  type MockAddress,
} from './mockAddresses';

interface AddressForm {
  type:      AddressType;
  label:     string;
  firstName: string;
  lastName:  string;
  phone:     string;
  line1:     string;
  line2:     string;
  city:      string;
  state:     string;
  pincode:   string;
  country:   string;
}

const TYPE_ICONS: Record<AddressType, React.ElementType> = {
  home:  Home,
  work:  Briefcase,
  other: MapPin,
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
];

function generateId() {
  return `addr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AccountAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = React.useState<MockAddress[]>([]);
  const [modalOpen,   setModalOpen]   = React.useState(false);
  const [editAddress, setEditAddress] = React.useState<MockAddress | null>(null);
  const [deleteId,    setDeleteId]    = React.useState<string | null>(null);
  const [isSaving,    setIsSaving]    = React.useState(false);

  // Load addresses
  React.useEffect(() => {
    if (user?.id) setAddresses(getStoredAddresses(user.id));
  }, [user?.id]);

  const persist = (updated: MockAddress[]) => {
    setAddresses(updated);
    if (user?.id) saveAddresses(user.id, updated);
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddressForm>({
    defaultValues: { type: 'home', country: 'India' },
  });

  const openAddModal = () => {
    setEditAddress(null);
    reset({ type: 'home', country: 'India', label: '', firstName: '', lastName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });
    setModalOpen(true);
  };

  const openEditModal = (addr: MockAddress) => {
    setEditAddress(addr);
    reset({
      type:      addr.type,
      label:     addr.label ?? '',
      firstName: addr.firstName,
      lastName:  addr.lastName,
      phone:     addr.phone,
      line1:     addr.line1,
      line2:     addr.line2 ?? '',
      city:      addr.city,
      state:     addr.state,
      pincode:   addr.pincode,
      country:   addr.country,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: AddressForm) => {
    setIsSaving(true);
    await new Promise((res) => setTimeout(res, 600));

    if (editAddress) {
      const updated = addresses.map((a) =>
        a.id === editAddress.id ? { ...a, ...data } : a,
      );
      persist(updated);
      toast.success('Address updated!');
    } else {
      const newAddr: MockAddress = {
        id:        generateId(),
        userId:    user?.id ?? '',
        isDefault: addresses.length === 0,
        ...data,
      };
      persist([...addresses, newAddr]);
      toast.success('Address added!');
    }

    setIsSaving(false);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    // If deleted was default, make first remaining one default
    if (updated.length > 0) {
      const wasDefault = addresses.find((a) => a.id === id)?.isDefault;
      if (wasDefault) updated[0] = { ...updated[0], isDefault: true };
    }
    persist(updated);
    setDeleteId(null);
    toast.success('Address removed');
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    persist(updated);
    toast.success('Default address updated');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-[var(--text)]">Addresses</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={openAddModal}
          id="address-add-btn"
        >
          Add Address
        </Button>
      </div>

      {/* Address cards */}
      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] py-16 text-center">
          <MapPin size={36} className="mx-auto text-[var(--text-subtle)] mb-3" />
          <h3 className="font-semibold text-[var(--text)]">No addresses yet</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1 mb-5">Add a shipping address to speed up checkout.</p>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openAddModal} id="address-add-first-btn">
            Add Your First Address
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr, i) => {
              const TypeIcon = TYPE_ICONS[addr.type] ?? MapPin;
              return (
                <motion.div
                  key={addr.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.06 } }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={cn(
                    'relative rounded-2xl border p-5 bg-[var(--background-card)] transition-shadow hover:shadow-[var(--shadow-card-hov)]',
                    addr.isDefault
                      ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/20'
                      : 'border-[var(--border)]',
                  )}
                >
                  {/* Default badge */}
                  {addr.isDefault && (
                    <span className="absolute top-4 right-4">
                      <Badge variant="primary" size="xs" icon={<Star size={9} />}>Default</Badge>
                    </span>
                  )}

                  {/* Type icon + label */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                      <TypeIcon size={16} className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--text)]">
                        {addr.label || (addr.type.charAt(0).toUpperCase() + addr.type.slice(1))}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] capitalize">{addr.type}</p>
                    </div>
                  </div>

                  {/* Address details */}
                  <div className="space-y-1 text-sm text-[var(--text)] mb-5">
                    <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                    <p className="text-[var(--text-muted)]">{addr.line1}</p>
                    {addr.line2 && <p className="text-[var(--text-muted)]">{addr.line2}</p>}
                    <p className="text-[var(--text-muted)]">{addr.city}, {addr.state} {addr.pincode}</p>
                    <p className="text-[var(--text-muted)]">{addr.country}</p>
                    <div className="flex items-center gap-1.5 pt-1 text-[var(--text-muted)]">
                      <Phone size={12} />
                      <span>{addr.phone}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!addr.isDefault && (
                      <Button
                        variant="outline"
                        size="xs"
                        leftIcon={<Check size={12} />}
                        onClick={() => handleSetDefault(addr.id)}
                        id={`addr-set-default-${addr.id}`}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="xs"
                      leftIcon={<Pencil size={12} />}
                      onClick={() => openEditModal(addr)}
                      id={`addr-edit-${addr.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      leftIcon={<Trash2 size={12} />}
                      onClick={() => setDeleteId(addr.id)}
                      className="text-[var(--danger)] hover:bg-[var(--danger-bg)]"
                      id={`addr-delete-${addr.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editAddress ? 'Edit Address' : 'Add New Address'}
        size="xl"
        scroll="inside"
        actions={[
          { label: 'Cancel', onClick: () => setModalOpen(false), variant: 'secondary' },
          { label: editAddress ? 'Save Changes' : 'Add Address', onClick: handleSubmit(onSubmit), variant: 'primary', isLoading: isSaving },
        ]}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Type + label */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text)]">
                Type <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                {...register('type')}
                className={cn(
                  'h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]',
                  'text-sm text-[var(--text)] outline-none transition-all',
                  'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
                )}
                id="addr-type"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input
              label="Label (optional)"
              placeholder="e.g. Mom's House"
              id="addr-label"
              {...register('label')}
            />
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              error={errors.firstName?.message}
              id="addr-first-name"
              {...register('firstName', { required: 'Required' })}
            />
            <Input
              label="Last Name"
              required
              error={errors.lastName?.message}
              id="addr-last-name"
              {...register('lastName', { required: 'Required' })}
            />
          </div>

          {/* Phone */}
          <Input
            label="Phone"
            type="tel"
            required
            leftIcon={<Phone size={15} />}
            error={errors.phone?.message}
            id="addr-phone"
            {...register('phone', {
              required: 'Required',
              pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' },
            })}
          />

          {/* Address lines */}
          <Input
            label="Address Line 1"
            placeholder="House no., Building, Street"
            required
            error={errors.line1?.message}
            id="addr-line1"
            {...register('line1', { required: 'Required' })}
          />
          <Input
            label="Address Line 2"
            placeholder="Apartment, suite, landmark (optional)"
            id="addr-line2"
            {...register('line2')}
          />

          {/* City + State + Pincode */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              required
              error={errors.city?.message}
              id="addr-city"
              {...register('city', { required: 'Required' })}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text)]">
                State <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                {...register('state', { required: 'Required' })}
                className={cn(
                  'h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]',
                  'text-sm text-[var(--text)] outline-none transition-all',
                  'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
                  errors.state && 'border-[var(--danger)]',
                )}
                id="addr-state"
              >
                <option value="">Select state…</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p className="text-xs text-[var(--danger)]">{errors.state.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Pincode"
              required
              error={errors.pincode?.message}
              id="addr-pincode"
              {...register('pincode', {
                required: 'Required',
                pattern: { value: /^\d{6}$/, message: 'Enter a valid 6-digit pincode' },
              })}
            />
            <Input
              label="Country"
              required
              readOnly
              id="addr-country"
              {...register('country')}
            />
          </div>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Address?"
        description="This action cannot be undone."
        size="sm"
        actions={[
          { label: 'Cancel',  onClick: () => setDeleteId(null), variant: 'secondary' },
          { label: 'Delete',  onClick: () => deleteId && handleDelete(deleteId), variant: 'destructive' },
        ]}
      />
    </motion.div>
  );
}
