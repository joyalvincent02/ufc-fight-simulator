import { BlockMath } from "react-katex";

interface MathFormulaProps {
  formula: string;
  description?: string;
}

export default function MathFormula({ formula, description }: MathFormulaProps) {
  return (
    <div>
      {description && <p className="text-sm mb-2">{description}</p>}
      <div className="overflow-x-auto">
        <BlockMath math={formula} />
      </div>
    </div>
  );
}
