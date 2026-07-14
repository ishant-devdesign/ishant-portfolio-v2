import { InlineContentRenderer } from "./inline-content-renderer";

export function StepperBlock({
  steps,
}: {
  steps: Array<{ title?: string; description?: string }>;
}) {
  if (!steps.length) return null;

  return (
    <div>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <div
            key={`${step.title ?? "step"}-${index}`}
            className="grid grid-cols-[3rem_minmax(0,1fr)] gap-5 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-6"
          >
            <div className="relative flex justify-center">
              {!isLast ? (
                <span
                  className="absolute bottom-0 top-10 w-px bg-gradient-to-b from-white/16 via-white/8 to-transparent"
                  aria-hidden="true"
                />
              ) : null}

              <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#0b0b0b] font-heading text-sm tracking-[-0.03em] text-white/54 sm:size-11">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className={isLast ? "pb-1" : "pb-8 sm:pb-10"}>
              {step.title ? (
                <h3 className="font-heading text-2xl leading-tight tracking-[-0.04em] text-white/90 sm:text-3xl">
                  <InlineContentRenderer text={step.title} />
                </h3>
              ) : null}

              {step.description ? (
                <p className="mt-3 whitespace-pre-line text-base leading-8 text-white/58 sm:text-lg">
                  <InlineContentRenderer text={step.description} />
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}