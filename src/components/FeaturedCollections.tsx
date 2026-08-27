import CollectionCard, { type CollectionCardItem } from "./CollectionCard";
import { SectionHeading, SectionViewAll } from "./SectionHeading";

export type FeaturedCollectionItem = CollectionCardItem;

/**
 * Homepage collection wall.
 *
 * Shares CollectionCard with the /collections directory rather than keeping a
 * second tile design: the two sit one click apart, and a visitor who taps
 * through should recognise the same objects rather than meet a different
 * treatment of them.
 */
export default function FeaturedCollections({
  collections,
  title,
  subtitle,
  backgroundColor,
}: {
  collections: FeaturedCollectionItem[];
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
}) {
  if (collections.length === 0) return null;

  return (
    <section className="section-py bg-beige/60" style={backgroundColor ? { backgroundColor } : undefined}>
      <div className="container-px mx-auto">
        <SectionHeading
          eyebrow={subtitle || "Shop by Collection"}
          title={title || "Our Collections"}
          description="Seasonal drops and curated edits, all in one place."
        />

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {collections.map((collection) => (
            <li key={collection.id}>
              <CollectionCard collection={collection} />
            </li>
          ))}
        </ul>

        <SectionViewAll href="/collections" label="View all collections" />
      </div>
    </section>
  );
}
