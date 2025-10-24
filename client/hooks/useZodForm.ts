import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function useZodForm<TSchema extends { _output: any }>(
  schema: any,
  defaults?: Partial<any>,
) {
  const f = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: defaults as any,
    mode: "onBlur",
  });
  return f;
}
