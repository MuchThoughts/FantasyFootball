import { Suspense } from "react";
import DraftTool from "@/components/DraftTool";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <DraftTool />
    </Suspense>
  );
}
