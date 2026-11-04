import { BanknotePanel } from "@/components/ui";

/** Home loading state: the note is already there; the numbers fill in. Static, nothing moves for decoration. */
export default function HomeLoading() {
  return (
    <BanknotePanel className="-mx-5 -mt-6 px-14 pt-24 pb-28 lg:-mx-12 lg:-mt-12 lg:px-24 lg:pt-[140px] lg:pb-[200px]">
      <div role="status" aria-live="polite" className="space-y-8">
        <p className="font-serif text-[2rem] leading-tight text-white lg:text-[2.6rem]">Working out your next two weeks.</p>
        <div aria-hidden className="rounded-[14px] bg-brand p-4 ring-1 ring-white/20 lg:p-6">
          <div className="flex gap-2 overflow-hidden lg:grid lg:grid-cols-7 lg:gap-3">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="w-[88px] shrink-0 lg:w-auto">
                <div className="h-3 w-10 rounded-full bg-white/20" />
                <div className="mt-2 h-[68px] rounded-tile bg-white/10 lg:h-[84px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </BanknotePanel>
  );
}
