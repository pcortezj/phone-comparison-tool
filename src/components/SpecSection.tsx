import type { DetailSpecCategory } from '@/lib/device-detail';

export default function SpecSection({ category, open = false }: { category: DetailSpecCategory; open?: boolean }) {
  return (
    <details className="spec-details" open={open}>
      <summary>
        <span className="eyebrow">{category.category}</span>
        <span className="spec-details-chevron" aria-hidden="true">
          ▾
        </span>
      </summary>
      <div className="device-spec-list">
        {category.specifications.map((spec) => (
          <div key={`${category.category}-${spec.name}`} className="device-spec-row">
            <span>{spec.name}</span>
            <strong>{spec.value}</strong>
          </div>
        ))}
      </div>
    </details>
  );
}
