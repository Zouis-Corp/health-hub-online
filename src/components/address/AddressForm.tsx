import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const addressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  address_line_1: z.string().min(5, "Address Line 1 is required").max(200),
  address_line_2: z.string().max(200).optional(),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  pincode: z.string().min(6, "Pincode must be 6 digits").max(6),
  landmark: z.string().max(200).optional(),
  is_default: z.boolean().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  initialData?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  showDefaultOption?: boolean;
}

const AddressForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save Address",
  showDefaultOption = true,
}: AddressFormProps) => {
  const [formData, setFormData] = useState<AddressFormData>({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
    address_line_1: initialData?.address_line_1 || "",
    address_line_2: initialData?.address_line_2 || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    pincode: initialData?.pincode || "",
    landmark: initialData?.landmark || "",
    is_default: initialData?.is_default || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        phone: initialData.phone || "",
        address_line_1: initialData.address_line_1 || "",
        address_line_2: initialData.address_line_2 || "",
        city: initialData.city || "",
        state: initialData.state || "",
        pincode: initialData.pincode || "",
        landmark: initialData.landmark || "",
        is_default: initialData.is_default || false,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = addressSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    
    await onSubmit(formData);
  };

  const updateField = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs sm:text-sm">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            className="h-9 sm:h-10 rounded-lg text-sm"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
          {errors.name && (
            <p className="text-[10px] sm:text-xs text-destructive">{errors.name}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs sm:text-sm">
            Mobile Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            placeholder="Enter mobile number"
            className="h-9 sm:h-10 rounded-lg text-sm"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
          {errors.phone && (
            <p className="text-[10px] sm:text-xs text-destructive">{errors.phone}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address_line_1" className="text-xs sm:text-sm">
          Address Line 1 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="address_line_1"
          placeholder="House/Flat No., Building, Street"
          className="h-9 sm:h-10 rounded-lg text-sm"
          value={formData.address_line_1}
          onChange={(e) => updateField("address_line_1", e.target.value)}
        />
        {errors.address_line_1 && (
          <p className="text-[10px] sm:text-xs text-destructive">{errors.address_line_1}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address_line_2" className="text-xs sm:text-sm">
          Address Line 2 <span className="text-muted-foreground">(Optional)</span>
        </Label>
        <Input
          id="address_line_2"
          placeholder="Area, Colony, Sector"
          className="h-9 sm:h-10 rounded-lg text-sm"
          value={formData.address_line_2}
          onChange={(e) => updateField("address_line_2", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-xs sm:text-sm">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            placeholder="City"
            className="h-9 sm:h-10 rounded-lg text-sm"
            value={formData.city}
            onChange={(e) => updateField("city", e.target.value)}
          />
          {errors.city && (
            <p className="text-[10px] sm:text-xs text-destructive">{errors.city}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state" className="text-xs sm:text-sm">
            State <span className="text-destructive">*</span>
          </Label>
          <Input
            id="state"
            placeholder="State"
            className="h-9 sm:h-10 rounded-lg text-sm"
            value={formData.state}
            onChange={(e) => updateField("state", e.target.value)}
          />
          {errors.state && (
            <p className="text-[10px] sm:text-xs text-destructive">{errors.state}</p>
          )}
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label htmlFor="pincode" className="text-xs sm:text-sm">
            Pincode <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pincode"
            placeholder="6-digit pincode"
            className="h-9 sm:h-10 rounded-lg text-sm"
            maxLength={6}
            value={formData.pincode}
            onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, ""))}
          />
          {errors.pincode && (
            <p className="text-[10px] sm:text-xs text-destructive">{errors.pincode}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="landmark" className="text-xs sm:text-sm">
          Landmark <span className="text-muted-foreground">(Optional)</span>
        </Label>
        <Input
          id="landmark"
          placeholder="Nearby landmark for easy delivery"
          className="h-9 sm:h-10 rounded-lg text-sm"
          value={formData.landmark}
          onChange={(e) => updateField("landmark", e.target.value)}
        />
      </div>

      {showDefaultOption && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_default"
            checked={formData.is_default}
            onCheckedChange={(checked) => updateField("is_default", !!checked)}
          />
          <Label htmlFor="is_default" className="text-xs sm:text-sm cursor-pointer">
            Set as default address
          </Label>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg"
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 h-10 bg-primary hover:bg-primary/90 rounded-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
