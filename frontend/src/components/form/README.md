# Form Field Components

Specialized form field components that integrate with the enhanced `useForm` hook to eliminate input pattern duplication.

## Components

### ClientNameField

Specialized input with integrated client suggestions dropdown.

```tsx
import { ClientNameField } from "../form";
import { useForm } from "../../hooks/useForm";

const form = useForm({
  initialData: { client_name: "" },
});

<ClientNameField form={form} fieldName="client_name" required maxLength={30} />;
```

### DateField

Standardized date input with consistent handling and helper text.

```tsx
import { DateField } from "../form";

<DateField
  form={form}
  fieldName="trip_date"
  label="Trip Date"
  required
  defaultToToday
/>;
```

### MilesField

Numeric input for miles with proper validation and formatting.

```tsx
import { MilesField } from "../form";

<MilesField form={form} fieldName="miles" required min={0} step="0.1" />;
```

### NotesField

Textarea component with optional character counting.

```tsx
import { NotesField } from "../form";

<NotesField form={form} fieldName="notes" rows={3} maxLength={500} />;
```

## Complete Example

```tsx
import { useForm } from "../../hooks/useForm";
import { ClientNameField, DateField, MilesField, NotesField } from "../form";

interface TripData {
  client_name: string;
  trip_date: string;
  miles: number;
  notes: string;
}

function TripForm() {
  const form = useForm<TripData>({
    initialData: {
      client_name: "",
      trip_date: "",
      miles: 0,
      notes: "",
    },
    validate: (data) => ({
      client_name: !data.client_name ? "Client name is required" : undefined,
      trip_date: !data.trip_date ? "Trip date is required" : undefined,
      miles: data.miles <= 0 ? "Miles must be greater than 0" : undefined,
      notes: undefined,
    }),
    onSubmit: async (data) => {
      // Handle form submission
      console.log("Submitting:", data);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <ClientNameField form={form} fieldName="client_name" required />

      <DateField form={form} fieldName="trip_date" required defaultToToday />

      <MilesField form={form} fieldName="miles" required />

      <NotesField form={form} fieldName="notes" />

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

## Benefits

- **DRY**: Eliminates repeated input patterns across components
- **Consistent**: Standardized styling and behavior
- **Integrated**: Works seamlessly with the enhanced `useForm` hook
- **Type-safe**: Full TypeScript support with proper error handling
- **Accessible**: Built-in ARIA attributes and proper labeling
- **Flexible**: Customizable props for different use cases
