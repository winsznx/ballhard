import type { ElementType, HTMLAttributes, ReactNode } from "react";

type GlassSurfaceProps<T extends ElementType = "div"> = {
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

export function GlassSurface<T extends ElementType = "div">({
  as,
  className = "",
  children,
  ...rest
}: GlassSurfaceProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag className={`glass ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
