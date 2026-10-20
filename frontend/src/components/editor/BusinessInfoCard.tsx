import React, { useRef } from 'react';
import { Building2, X, Upload } from 'lucide-react';

interface BusinessInfoCardProps {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessLogo?: string;
  onChange: (fields: Partial<{
    business_name: string;
    business_email: string;
    business_phone: string;
    business_address: string;
    business_logo: string;
  }>) => void;
}

export const BusinessInfoCard: React.FC<BusinessInfoCardProps> = ({
  businessName,
  businessEmail,
  businessPhone,
  businessAddress,
  businessLogo,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onChange({ business_logo: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      {/* Card Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <h3 className="font-bold text-xs sm:text-sm text-slate-900">Business Information</h3>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Left Form Inputs */}
        <div className="flex-1 w-full space-y-3">
          {/* Row 1: Business Name | Email | Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="biz-name" className="block text-[11px] font-medium text-slate-600 mb-1">
                Business Name
              </label>
              <input
                id="biz-name"
                type="text"
                value={businessName}
                onChange={(e) => onChange({ business_name: e.target.value })}
                placeholder="e.g. Acme Studio"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="biz-email" className="block text-[11px] font-medium text-slate-600 mb-1">
                Email
              </label>
              <input
                id="biz-email"
                type="email"
                value={businessEmail}
                onChange={(e) => onChange({ business_email: e.target.value })}
                placeholder="e.g. hello@business.com"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="biz-phone" className="block text-[11px] font-medium text-slate-600 mb-1">
                Phone
              </label>
              <input
                id="biz-phone"
                type="text"
                value={businessPhone}
                onChange={(e) => onChange({ business_phone: e.target.value })}
                placeholder="e.g. +1 (555) 000-0000"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          {/* Row 2: Address */}
          <div>
            <label htmlFor="biz-address" className="block text-[11px] font-medium text-slate-600 mb-1">
              Address
            </label>
            <textarea
              id="biz-address"
              rows={2}
              value={businessAddress}
              onChange={(e) => onChange({ business_address: e.target.value })}
              placeholder="e.g. 123 Market Street, Suite 400"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Right Logo Upload Container */}
        <div className="w-full sm:w-36 shrink-0 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-600">Logo</span>
            {businessLogo && (
              <button
                type="button"
                onClick={() => onChange({ business_logo: '' })}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear logo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-28 w-full border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
          >
            {businessLogo ? (
              <div className="w-12 h-12 mb-1 flex items-center justify-center">
                <img
                  src={businessLogo}
                  alt="Logo preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-8 h-8 mb-1 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
            )}
            <p className="text-[11px] font-semibold text-slate-700 leading-tight">
              {businessLogo ? 'Change Logo' : 'Upload Logo'}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">
              PNG, JPG, SVG (Max 1MB)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
