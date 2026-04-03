import { HomePratiqueSlide } from "./HomePratiqueSlide";

interface Props {
  userName?: string | null;
}

export function HomeHeroSlider({ userName }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <div className="overflow-hidden">
          <HomePratiqueSlide />
        </div>
      </div>
    </div>
  );
}
