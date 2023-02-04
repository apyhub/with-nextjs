import {
  AppShell,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Switch,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import {
  IconAt,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconRepeat,
} from "@tabler/icons";
import { useMutation } from "@tanstack/react-query";
import { data } from "apyhub";
import dayjs from "dayjs";
import type { NextPage } from "next";

interface FormValues {
  summary: string;
  description: string;
  organizer_email: string;
  attendees_emails: string[];
  location: string;
  timezone: string;
  meeting_date: Date;
  start_time: Date;
  end_time: Date;
  all_day: boolean;
  recurrence_frequency: "None" | "Daily" | "Weekly" | "Monthly" | "Yearly";
  recurrence_count: number;
}

const postEvent = async (values: FormValues) => {
  const response = await fetch("/api/ical", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: values.summary,
      description: values.description,
      organizer_email: values.organizer_email,
      attendees_emails: values.attendees_emails,
      location: values.location,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      start_time: values.all_day
        ? "00:00"
        : dayjs(values.start_time).format("HH:mm"),
      end_time: values.all_day
        ? "00:00"
        : dayjs(values.end_time).format("HH:mm"),
      meeting_date: dayjs(values.meeting_date).format("DD-MM-YYYY"),
      recurring: values.recurrence_frequency !== "None",
      recurrence: {
        frequency:
          values.recurrence_frequency !== "None"
            ? values.recurrence_frequency.toUpperCase()
            : null,
        count:
          values.recurrence_frequency !== "None"
            ? values.recurrence_count
            : null,
      },
    }),
  });

  const { data } = await response.json();
  window.open(data, "_blank");
};

export const getServerSideProps = async () => {
  const { data: timezones } = await data.timezones();
  return {
    props: {
      timezones,
    },
  };
};

type Props = {
  timezones: {
    key: string;
    value: string;
    abbreviation: string[];
    utc_time: string;
  }[];
};

const Home: NextPage<Props> = ({ timezones }: Props) => {
  const { mutate, isLoading } = useMutation(postEvent, {
    onSuccess: () => {
      showNotification({
        title: "Success",
        color: "green",
        message: "Event created successfully",
      });
    },
    onError: (error: Error) => {
      showNotification({
        title: "Error",
        color: "red",
        message: error.message,
      });
    },
  });
  const form = useForm<FormValues>({
    initialValues: {
      summary: "",
      description: "",
      organizer_email: "",
      attendees_emails: [],
      location: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      meeting_date: new Date(),
      start_time: dayjs().hour(9).minute(0).toDate(),
      end_time: dayjs().hour(10).minute(0).toDate(),
      all_day: false,
      recurrence_frequency: "None",
      recurrence_count: 0,
    },
    validate: {
      summary: (value) => (value ? null : "Summary is required"),
      meeting_date: (value) => {
        if (!value) {
          return "Meeting date is required";
        }
      },
      // organizer_email must be a valid email
      organizer_email: (value) => {
        if (!value) {
          return "Organizer email is required";
        }
        if (!value.includes("@")) {
          return "Organizer email must be a valid email";
        }
      },
      // attendees_emails must be a valid email
      attendees_emails: (value) => {
        if (value.length === 0) {
          return "Attendees emails are required";
        }
        if (value.some((email) => !email.includes("@"))) {
          return "Attendees emails must be a valid email";
        }
      },
    },
  });

  return (
    <AppShell>
      <Container size="sm">
        <Card withBorder m="xl" p="xl" shadow="xl">
          <Title my="xl">Create iCal Event</Title>
          <form onSubmit={form.onSubmit((values) => mutate(values))}>
            <Stack spacing="xl">
              <TextInput
                disabled={isLoading}
                withAsterisk
                required
                label="Summary"
                placeholder="Summary"
                {...form.getInputProps("summary")}
              />
              <Textarea
                disabled={isLoading}
                withAsterisk
                required
                label="Description"
                placeholder="Description"
                {...form.getInputProps("description")}
              />
              <TextInput
                disabled={isLoading}
                withAsterisk
                required
                label="Organizer Email"
                placeholder="Organizer email"
                icon={<IconAt size={14} />}
                {...form.getInputProps("organizer_email")}
              />
              <MultiSelect
                withAsterisk
                required
                disabled={isLoading}
                icon={<IconAt size={14} />}
                data={form.values.attendees_emails}
                getCreateLabel={(query) => `+ Add ${query}`}
                onCreate={(query) => {
                  if (/^\S+@\S+$/.test(query)) {
                    form.setValues({
                      attendees_emails: [
                        ...form.values.attendees_emails,
                        query,
                      ],
                    });
                    return query;
                  } else {
                    form.setFieldError("attendees_emails", "Invalid email");
                  }
                }}
                error={form.errors.attendees_emails}
                label="Attendees Emails"
                creatable
                searchable
              />
              <TextInput
                withAsterisk
                required
                disabled={isLoading}
                icon={<IconMapPin size={14} />}
                label="Location"
                {...form.getInputProps("location")}
              />
              <Select
                withAsterisk
                required
                searchable
                nothingFound="No options"
                disabled={isLoading}
                maxDropdownHeight={280}
                label="Timezone"
                {...form.getInputProps("timezone")}
                data={Array.from(
                  new Set(timezones.map((timezone) => timezone.value))
                )}
              />
              <DatePicker
                disabled={isLoading}
                withAsterisk
                required
                icon={<IconCalendar size={14} />}
                label="Date"
                {...form.getInputProps("meeting_date")}
              />
              <Checkbox
                disabled={isLoading}
                label="All Day"
                {...form.getInputProps("all_day")}
              />
              <Group>
                <TimeInput
                  icon={<IconClock size={14} />}
                  label="Start Time"
                  {...form.getInputProps("start_time")}
                  disabled={form.values.all_day || isLoading}
                />
                <TimeInput
                  icon={<IconClock size={14} />}
                  label="End Time"
                  {...form.getInputProps("end_time")}
                  disabled={form.values.all_day || isLoading}
                />
              </Group>
              <Group>
                <Select
                  icon={<IconRepeat size={14} />}
                  {...form.getInputProps("recurrence_frequency")}
                  label="Repeat"
                  data={["None", "Daily", "Weekly", "Monthly", "Yearly"]}
                  disabled={isLoading}
                />
                <NumberInput
                  {...form.getInputProps("recurrence_count")}
                  min={0}
                  label="Times"
                  disabled={
                    form.values.recurrence_frequency === "None" || isLoading
                  }
                />
              </Group>
              <Group position="right">
                <Button type="submit" loading={isLoading}>
                  Create Event
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Container>
    </AppShell>
  );
};

export default Home;
