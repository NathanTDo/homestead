import { ChipSelect, type ChipOption } from '@/components/common';

export interface PlantFilterOption {
  plantId: string;
  name: string;
}

interface PlantFilterProps {
  plants: readonly PlantFilterOption[];
  /** The selected plant, or null for all plants. */
  selectedPlantId: string | null;
  onChange: (plantId: string | null) => void;
}

const ALL = 'all';

/** Chips for "All Plants" and each of the user's active crops. */
export function PlantFilter({ plants, selectedPlantId, onChange }: PlantFilterProps) {
  const options: ChipOption<string>[] = [
    { value: ALL, label: 'All Plants' },
    ...plants.map((plant) => ({ value: plant.plantId, label: plant.name })),
  ];
  return (
    <ChipSelect<string>
      label="Show"
      options={options}
      selected={[selectedPlantId ?? ALL]}
      // Tapping the selected chip clears the choice, which means "All Plants".
      onChange={(next) => onChange(next[0] && next[0] !== ALL ? next[0] : null)}
    />
  );
}
