import { generate } from "apyhub";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    summary,
    description,
    organizer_email,
    attendees_emails,
    location,
    timezone,
    start_time,
    end_time,
    meeting_date,
    recurring,
    recurrence,
  } = req.body;
  const url = await generate.ical({
    summary,
    description,
    organizerEmail: organizer_email,
    attendeesEmails: attendees_emails,
    location,
    timeZone: timezone,
    startTime: start_time,
    endTime: end_time,
    meetingDate: meeting_date,
    recurring,
    recurrence,
    responseFormat: "url",
  });
  return res.status(200).json(url);
};

export default handler;
