import type { ReactNode } from "react";

interface PagePlaceholderProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function PagePlaceholder({
  icon,
  title,
  description,
}: PagePlaceholderProps) {
  return (
    <div className="page-placeholder text-center">
      <div className="page-placeholder__icon" aria-hidden="true">
        {icon}
      </div>
      <h2 className="page-placeholder__title">{title}</h2>
      <p className="page-placeholder__description mb-0">{description}</p>
    </div>
  );
}
