import { ChevronRight } from "lucide-react";
import papIcon from "@/assets/pap.svg";
import rxUploadIcon from "@/assets/rx_upload.svg";
import whyUsIcon from "@/assets/why_us.svg";
import discountIcon from "@/assets/discount.svg";

const actions = [
  {
    id: 1,
    title: "Patient Assistance Support",
    icon: papIcon,
    bgColor: "bg-red-50",
    textColor: "text-red-600",
  },
  {
    id: 2,
    title: "Order By Prescription",
    icon: rxUploadIcon,
    bgColor: "bg-slate-100",
    textColor: "text-slate-700",
  },
  {
    id: 3,
    title: "People love us More",
    icon: whyUsIcon,
    bgColor: "bg-green-50",
    textColor: "text-slate-700",
  },
  {
    id: 4,
    title: "We Give Upto 85% Discount",
    icon: discountIcon,
    bgColor: "bg-red-50",
    textColor: "text-red-600",
  },
];

const QuickActions = () => {
  return (
    <section className="py-6 bg-background">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {actions.map((action) => (
            <div
              key={action.id}
              className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 ${action.bgColor} rounded-2xl border border-transparent`}
            >
              {/* Icon */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center flex-shrink-0">
                <img src={action.icon} alt="" className="w-8 h-8 sm:w-12 sm:h-12 object-contain" />
              </div>
              
              {/* Arrow Circle - hidden on mobile */}
              <div className="hidden sm:flex w-8 h-8 bg-white rounded-full items-center justify-center shadow-sm flex-shrink-0">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Title */}
              <p className={`text-xs sm:text-sm font-semibold ${action.textColor} leading-tight`}>
                {action.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActions;
