import { icons, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicIconProps extends LucideProps {
  name: string;
  animated?: boolean;
}

const DynamicIcon = ({ name, animated = true, className, ...props }: DynamicIconProps) => {
  const LucideIcon = icons[name as keyof typeof icons];
  
  if (!LucideIcon) {
    // Fallback to a default icon if the specified one doesn't exist
    const FallbackIcon = icons.Pill;
    return (
      <FallbackIcon 
        className={cn(animated && "animate-draw-icon", className)} 
        {...props} 
      />
    );
  }

  return (
    <LucideIcon 
      className={cn(animated && "animate-draw-icon", className)} 
      {...props} 
    />
  );
};

export default DynamicIcon;
