interface FilterComponentProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (cat: string, checked: boolean) => void;
}

export default function FilterComponent({
  categories,
  selectedCategories,
  onCategoryChange,
}: FilterComponentProps) {
  return (
    <div className="w-full max-w-md">
      <label className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 block">
        分野を選択
      </label>
      <div className="flex flex-col gap-2">
        {categories.map((cat) => {
          const checked = selectedCategories.includes(cat);
          return (
            <label
              key={cat}
              className={`flex items-center gap-3 cursor-pointer rounded-lg p-2 sm:p-3 border-2 transition-colors duration-150
                ${checked
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={e => onCategoryChange(cat, e.target.checked)}
                className="sr-only"
                id={`cat-checkbox-${cat}`}
              />
              <span
                className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors duration-150
                  ${checked
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500'
                  }`}
                aria-hidden="true"
              >
                {checked && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 16 16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l3 3 5-5" />
                  </svg>
                )}
              </span>
              <span className="text-gray-800 dark:text-gray-100 text-base">{cat}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
