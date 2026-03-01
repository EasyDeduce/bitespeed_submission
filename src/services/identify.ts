import { Op } from "sequelize";
import Contact from "../models/Contact";

interface IdentifyRequest {
  email?: string | null;
  phoneNumber?: string | null;
}

interface IdentifyResponse {
  contact: {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export async function identify(body: IdentifyRequest): Promise<IdentifyResponse> {
  const { email, phoneNumber } = body;

  const emailStr = email ? String(email).trim() : null;
  const phoneStr = phoneNumber ? String(phoneNumber).trim() : null;

  if (!emailStr && !phoneStr) {
    throw new Error("At least one of email or phoneNumber must be provided");
  }

  // Step 1: Find all contacts that match either the email or phoneNumber
  const whereConditions: any[] = [];
  if (emailStr) whereConditions.push({ email: emailStr });
  if (phoneStr) whereConditions.push({ phoneNumber: phoneStr });

  const matchingContacts = await Contact.findAll({
    where: { [Op.or]: whereConditions },
    order: [["createdAt", "ASC"]],
  });

  // Step 2: If no matches, create a new primary contact
  if (matchingContacts.length === 0) {
    const newContact = await Contact.create({
      email: emailStr,
      phoneNumber: phoneStr,
      linkedId: null,
      linkPrecedence: "primary",
    });

    return {
      contact: {
        primaryContactId: newContact.id,
        emails: emailStr ? [emailStr] : [],
        phoneNumbers: phoneStr ? [phoneStr] : [],
        secondaryContactIds: [],
      },
    };
  }

  // Step 3: Gather all linked primary contact IDs
  const primaryIds = new Set<number>();
  for (const c of matchingContacts) {
    if (c.linkPrecedence === "primary") {
      primaryIds.add(c.id);
    } else if (c.linkedId) {
      primaryIds.add(c.linkedId);
    }
  }

  // Fetch all primary contacts to determine the oldest
  const primaryContacts = await Contact.findAll({
    where: { id: Array.from(primaryIds) },
    order: [["createdAt", "ASC"]],
  });

  // The oldest primary contact becomes THE primary
  const truePrimary = primaryContacts[0];

  // Step 4: If there are multiple primary contacts, turn the newer ones into secondary
  if (primaryContacts.length > 1) {
    for (let i = 1; i < primaryContacts.length; i++) {
      const olderSecondary = primaryContacts[i];
      await olderSecondary.update({
        linkedId: truePrimary.id,
        linkPrecedence: "secondary",
      });

      // Also update all contacts that were linked to this now-secondary contact
      await Contact.update(
        { linkedId: truePrimary.id },
        { where: { linkedId: olderSecondary.id } }
      );
    }
  }

  // Step 5: Check if we need to create a new secondary contact
  // A new secondary is needed if the incoming request has new information
  // (i.e., the exact combination of email+phone doesn't exist, and there's genuinely new info)
  if (emailStr && phoneStr) {
    const exactMatch = matchingContacts.find(
      (c) => c.email === emailStr && c.phoneNumber === phoneStr
    );

    if (!exactMatch) {
      // Check if both email and phone already exist in the contact group
      // Re-fetch all contacts in this group after merging
      const allGroupContacts = await Contact.findAll({
        where: {
          [Op.or]: [
            { id: truePrimary.id },
            { linkedId: truePrimary.id },
          ],
        },
      });

      const existingEmails = new Set(allGroupContacts.map((c) => c.email).filter(Boolean));
      const existingPhones = new Set(allGroupContacts.map((c) => c.phoneNumber).filter(Boolean));

      const hasNewEmail = !existingEmails.has(emailStr);
      const hasNewPhone = !existingPhones.has(phoneStr);

      if (hasNewEmail || hasNewPhone) {
        await Contact.create({
          email: emailStr,
          phoneNumber: phoneStr,
          linkedId: truePrimary.id,
          linkPrecedence: "secondary",
        });
      }
    }
  }

  // Step 6: Fetch the final consolidated group
  const allContacts = await Contact.findAll({
    where: {
      [Op.or]: [
        { id: truePrimary.id },
        { linkedId: truePrimary.id },
      ],
    },
    order: [["createdAt", "ASC"]],
  });

  // Build the response
  const emails: string[] = [];
  const phoneNumbers: string[] = [];
  const secondaryContactIds: number[] = [];
  const emailSet = new Set<string>();
  const phoneSet = new Set<string>();

  for (const c of allContacts) {
    if (c.email && !emailSet.has(c.email)) {
      emails.push(c.email);
      emailSet.add(c.email);
    }
    if (c.phoneNumber && !phoneSet.has(c.phoneNumber)) {
      phoneNumbers.push(c.phoneNumber);
      phoneSet.add(c.phoneNumber);
    }
    if (c.linkPrecedence === "secondary") {
      secondaryContactIds.push(c.id);
    }
  }

  return {
    contact: {
      primaryContactId: truePrimary.id,
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  };
}
