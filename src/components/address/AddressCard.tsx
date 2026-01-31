import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Check } from "lucide-react";

interface Address {
  id: string;
  name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  is_default?: boolean | null;
}

interface AddressCardProps {
  address: Address;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  showActions?: boolean;
  selectable?: boolean;
}

const AddressCard = ({
  address,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  showActions = true,
  selectable = false,
}: AddressCardProps) => {
  const fullAddress = [
    address.address_line_1,
    address.address_line_2,
    address.landmark ? `Near ${address.landmark}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      onClick={selectable ? onSelect : undefined}
      className={`bg-card rounded-xl border p-4 shadow-card transition-all ${
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : address.is_default
          ? "border-primary/50"
          : "border-border"
      } ${selectable ? "cursor-pointer hover:border-primary/70" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {selectable && isSelected && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
          {address.is_default && (
            <Badge className="bg-secondary text-secondary-foreground text-xs">
              Default
            </Badge>
          )}
        </div>
        {showActions && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="space-y-1 text-sm">
        <p className="font-semibold text-foreground">{address.name}</p>
        <p className="text-muted-foreground">{fullAddress}</p>
        <p className="text-muted-foreground">
          {address.city}, {address.state} - {address.pincode}
        </p>
        <p className="text-muted-foreground">Phone: {address.phone}</p>
      </div>
      {showActions && !address.is_default && onSetDefault && (
        <Button
          variant="link"
          size="sm"
          className="mt-2 p-0 h-auto text-primary text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onSetDefault();
          }}
        >
          Set as default
        </Button>
      )}
    </div>
  );
};

export default AddressCard;
