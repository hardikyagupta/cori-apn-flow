import { useNavigate } from "react-router-dom";

// Line icons traced from Figma (node 16785:23312, "L2 Old") — stroke uses
// currentColor so each row can drive its own active/inactive tint.
function IconCampaigns({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 13.5 13.5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.869 5.824C5.3 3.762 7.764 3.48 9.16 3.583C9.35262 3.59568 9.53408 3.67792 9.67058 3.81442C9.80708 3.95092 9.88932 4.13238 9.902 4.325C10.005 5.722 9.723 8.185 7.662 10.616C7.318 11.021 6.712 11.032 6.39 10.61C5.9 9.965 5.376 9.031 5.376 8.11C4.454 8.11 3.52 7.586 2.876 7.095C2.454 6.774 2.464 6.167 2.869 5.824Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.407 8.078L7.227 6.258" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.75 13C10.75 13 13 10.75 13 6.75C13 2.75 10.75 0.5 6.75 0.5C2.75 0.5 0.5 2.75 0.5 6.75C0.5 10.75 2.75 13 6.75 13Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconJourney({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12.5 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 2H9.25C9.82496 2.00015 10.378 2.22041 10.7957 2.61555C11.2134 3.01069 11.4639 3.55074 11.4959 4.1248C11.5279 4.69887 11.3389 5.26341 10.9677 5.70251C10.5966 6.14161 10.0714 6.42196 9.5 6.486" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 6.5H2.75C2.17504 6.50015 1.62195 6.72041 1.20429 7.11555C0.786631 7.51069 0.536085 8.05074 0.504092 8.6248C0.4721 9.19887 0.66109 9.76341 1.03226 10.2025C1.40343 10.6416 1.92862 10.922 2.5 10.986" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11H5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 2H0.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 2C2.5 2.39782 2.65804 2.77936 2.93934 3.06066C3.22064 3.34196 3.60218 3.5 4 3.5C4.39782 3.5 4.77936 3.34196 5.06066 3.06066C5.34196 2.77936 5.5 2.39782 5.5 2C5.5 1.60218 5.34196 1.22064 5.06066 0.93934C4.77936 0.658035 4.39782 0.5 4 0.5C3.60218 0.5 3.22064 0.658035 2.93934 0.93934C2.65804 1.22064 2.5 1.60218 2.5 2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 11C2.5 11.3978 2.65804 11.7794 2.93934 12.0607C3.22064 12.342 3.60218 12.5 4 12.5C4.39782 12.5 4.77936 12.342 5.06066 12.0607C5.34196 11.7794 5.5 11.3978 5.5 11C5.5 10.6022 5.34196 10.2206 5.06066 9.93934C4.77936 9.65804 4.39782 9.5 4 9.5C3.60218 9.5 3.22064 9.65804 2.93934 9.93934C2.65804 10.2206 2.5 10.6022 2.5 11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 6.5C6.5 6.89782 6.65804 7.27936 6.93934 7.56066C7.22064 7.84196 7.60218 8 8 8C8.39782 8 8.77936 7.84196 9.06066 7.56066C9.34196 7.27936 9.5 6.89782 9.5 6.5C9.5 6.10218 9.34196 5.72064 9.06066 5.43934C8.77936 5.15804 8.39782 5 8 5C7.60218 5 7.22064 5.15804 6.93934 5.43934C6.65804 5.72064 6.5 6.10218 6.5 6.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 12.486C11.063 12.486 11.813 11.736 12 10.986C11.812 10.236 11.062 9.486 10.5 9.486" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconOnSiteMessages({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 13.6372 13.7101" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.69612 10.71C4.79112 10.71 5.40612 10.094 5.40612 9C5.40612 7.905 4.79112 7.29 3.69612 7.29C2.60212 7.29 1.98612 7.905 1.98612 9C1.98612 10.094 2.60212 10.71 3.69612 10.71Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.89312 13.21C6.71556 12.4965 6.30443 11.863 5.72517 11.4102C5.14591 10.9575 4.43183 10.7115 3.69662 10.7115C2.9614 10.7115 2.24732 10.9575 1.66807 11.4102C1.08881 11.863 0.677672 12.4965 0.500118 13.21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5601 6.545C10.4406 6.06687 10.1646 5.64241 9.77615 5.33911C9.38768 5.03581 8.90897 4.87106 8.41612 4.87106C7.92326 4.87106 7.44455 5.03581 7.05608 5.33911C6.66761 5.64241 6.39167 6.06687 6.27212 6.545" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.70312 4.979C3.68312 4.146 3.70412 3.334 3.76712 2.459C3.83612 1.499 4.61812 0.749 5.57712 0.662C6.49712 0.578 7.44712 0.5 8.41712 0.5C9.38712 0.5 10.3351 0.578 11.2571 0.662C12.2141 0.75 12.9971 1.498 13.0661 2.458C13.1608 3.73391 13.1608 5.01509 13.0661 6.291C12.9971 7.251 12.2151 7.999 11.2561 8.087C10.3361 8.171 9.38612 8.249 8.41612 8.249C8.13812 8.249 7.86112 8.243 7.58612 8.232" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.41612 4.868C9.25612 4.868 9.72912 4.396 9.72912 3.555C9.72912 2.715 9.25612 2.242 8.41612 2.242C7.57612 2.242 7.10312 2.715 7.10312 3.555C7.10312 4.395 7.57612 4.868 8.41612 4.868Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconContentPersonalisation({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 13.212 13.5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.528 6.252H9.684" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.528 9.221H6.479" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M0.698 10.275C0.859 11.715 2.029 12.857 3.476 12.927C4.476 12.975 5.497 13 6.606 13C7.715 13 8.736 12.975 9.736 12.927C11.183 12.857 12.353 11.714 12.514 10.275C12.623 9.305 12.712 8.312 12.712 7.299C12.712 6.287 12.622 5.293 12.514 4.324C12.353 2.884 11.183 1.742 9.736 1.672C8.736 1.624 7.715 1.599 6.606 1.599C5.497 1.599 4.476 1.624 3.476 1.672C2.029 1.742 0.859 2.885 0.698 4.324C0.589 5.294 0.5 6.287 0.5 7.299C0.5 8.312 0.59 9.306 0.698 10.275Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.606 0.5V3.04" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.606 0.5V3.04" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.606 0.5V3.04" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconProductPersonalisation({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 13.2497 13.2497" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.41966 12.246C5.70366 12.894 4.61566 12.914 3.85366 12.322C3.30163 11.9042 2.77628 11.4524 2.28066 10.969C1.79728 10.4731 1.3454 9.94737 0.927665 9.395C0.335665 8.633 0.355664 7.545 1.00366 6.829C2.38335 5.30581 3.85298 3.86657 5.40466 2.519C5.69431 2.26368 6.05729 2.10652 6.44166 2.07C7.57666 1.968 10.0207 1.84 10.7157 2.534C11.4107 3.229 11.2817 5.672 11.1797 6.808C11.1429 7.19249 10.9853 7.55549 10.7297 7.845C9.38209 9.39667 7.94285 10.8663 6.41966 12.246Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.7497 0.5L8.77266 4.477" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const items: {
  key: string;
  label: string;
  icon: ({ className }: { className?: string }) => JSX.Element;
  route?: string;
}[] = [
  { key: "campaigns", label: "Campaigns", icon: IconCampaigns, route: "/campaigns" },
  { key: "journey", label: "Journey", icon: IconJourney, route: "/journeys" },
  { key: "onsite", label: "On-site messages", icon: IconOnSiteMessages, route: "/onsite-messages" },
  { key: "content", label: "Content personalisation", icon: IconContentPersonalisation },
  { key: "product", label: "Product personalisation", icon: IconProductPersonalisation },
];

/**
 * Engage L2 — the flyout menu that opens beside the Engage entry in the L1
 * rail (Figma node 16785:23312, "L2 Old"). Same Primary/Ash background as
 * the rail so it reads as a drawer sliding out of it, not a separate card.
 */
export default function EngageL2({
  active = "campaigns",
  onClose,
}: {
  /** Which item renders in the active (Primary/Core orange) tint. */
  active?: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed left-12 top-[147px] z-50 w-[176px] animate-in fade-in slide-in-from-left-2 duration-200 rounded-[8px] bg-[#291E30] p-4"
      role="menu"
      aria-label="Engage"
    >
      <p className="font-manrope text-xs font-bold text-white">Engage</p>

      <div className="mt-[18px] flex flex-col gap-5">
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              role="menuitem"
              onClick={() => {
                onClose();
                if (item.route) navigate(item.route);
              }}
              className="flex items-start gap-2.5 text-left"
            >
              <item.icon
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                  isActive ? "text-[#FC5E02]" : "text-[#AC9AB8]"
                }`}
              />
              <span
                className={`font-manrope text-[13px] leading-[18px] ${
                  isActive
                    ? "font-medium text-[#FC5E02]"
                    : item.key === "journey"
                    ? "font-semibold text-[#AC9AB8]"
                    : "font-normal text-[#AC9AB8]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
