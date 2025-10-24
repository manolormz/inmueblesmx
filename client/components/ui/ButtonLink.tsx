import React from "react";
import { Link, LinkProps } from "react-router-dom";
import { Button, ButtonProps } from "@/components/ui/button";

export default function ButtonLink({
  to,
  children,
  variant,
  size,
  className,
  ...rest
}: { to: LinkProps["to"]; children: React.ReactNode } & Pick<
  ButtonProps,
  "variant" | "size" | "className"
>) {
  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={className}
      {...(rest as any)}
    >
      <Link to={to}>{children}</Link>
    </Button>
  );
}
