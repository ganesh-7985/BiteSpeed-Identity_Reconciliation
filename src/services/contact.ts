import { PrismaClient, Contact } from "@prisma/client";

const prisma = new PrismaClient();

interface IdentifyRequest {
  email?: string | null;
  phoneNumber?: string | null;
}

interface IdentifyResponse {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export async function identifyContact(
  body: IdentifyRequest
): Promise<IdentifyResponse> {
  const { email, phoneNumber } = body;

  const emailStr = email ? String(email).trim() : null;
  const phoneStr = phoneNumber ? String(phoneNumber).trim() : null;

  if (!emailStr && !phoneStr) {
    throw new Error("At least one of email or phoneNumber must be provided");
  }

  // Find all contacts matching email or phone
  const matchingContacts = await findMatchingContacts(emailStr, phoneStr);

  if (matchingContacts.length === 0) {
    // No matches — create a new primary contact
    const newContact = await prisma.contact.create({
      data: {
        email: emailStr,
        phoneNumber: phoneStr,
        linkPrecedence: "primary",
      },
    });
    return buildResponse(newContact.id);
  }

  // Resolve all contacts to their primary IDs
  const primaryIds = new Set<number>();
  for (const contact of matchingContacts) {
    if (contact.linkPrecedence === "primary") {
      primaryIds.add(contact.id);
    } else if (contact.linkedId) {
      primaryIds.add(contact.linkedId);
    }
  }

  const primaryContacts = await prisma.contact.findMany({
    where: { id: { in: Array.from(primaryIds) } },
    orderBy: { createdAt: "asc" },
  });

  // The oldest primary is the surviving primary
  const survivingPrimary = primaryContacts[0];

  // If there are multiple primary groups, merge them
  if (primaryContacts.length > 1) {
    for (let i = 1; i < primaryContacts.length; i++) {
      const demotedPrimary = primaryContacts[i];
      // Demote this primary to secondary
      await prisma.contact.update({
        where: { id: demotedPrimary.id },
        data: {
          linkedId: survivingPrimary.id,
          linkPrecedence: "secondary",
        },
      });
      // Re-point all secondaries of the demoted primary to the surviving primary
      await prisma.contact.updateMany({
        where: { linkedId: demotedPrimary.id },
        data: { linkedId: survivingPrimary.id },
      });
    }
  }

  // Check if we need to create a new secondary contact
  // A new secondary is needed if the request introduces new information
  const allGroupContacts = await getAllGroupContacts(survivingPrimary.id);

  const existingEmails = new Set(
    allGroupContacts.map((c) => c.email).filter(Boolean)
  );
  const existingPhones = new Set(
    allGroupContacts.map((c) => c.phoneNumber).filter(Boolean)
  );

  const hasNewEmail = emailStr && !existingEmails.has(emailStr);
  const hasNewPhone = phoneStr && !existingPhones.has(phoneStr);

  // Check if this exact combination already exists
  const exactMatch = allGroupContacts.some(
    (c) =>
      (emailStr ? c.email === emailStr : !c.email) &&
      (phoneStr ? c.phoneNumber === phoneStr : !c.phoneNumber)
  );

  if ((hasNewEmail || hasNewPhone) && !exactMatch) {
    await prisma.contact.create({
      data: {
        email: emailStr,
        phoneNumber: phoneStr,
        linkedId: survivingPrimary.id,
        linkPrecedence: "secondary",
      },
    });
  }

  return buildResponse(survivingPrimary.id);
}

async function findMatchingContacts(
  email: string | null,
  phone: string | null
): Promise<Contact[]> {
  const conditions: any[] = [];
  if (email) conditions.push({ email });
  if (phone) conditions.push({ phoneNumber: phone });

  if (conditions.length === 0) return [];

  return prisma.contact.findMany({
    where: {
      OR: conditions,
      deletedAt: null,
    },
  });
}

async function getAllGroupContacts(primaryId: number): Promise<Contact[]> {
  const primary = await prisma.contact.findUnique({
    where: { id: primaryId },
  });

  const secondaries = await prisma.contact.findMany({
    where: {
      linkedId: primaryId,
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  return primary ? [primary, ...secondaries] : secondaries;
}

async function buildResponse(primaryId: number): Promise<IdentifyResponse> {
  const allContacts = await getAllGroupContacts(primaryId);
  const primary = allContacts[0];

  const emails: string[] = [];
  const phoneNumbers: string[] = [];
  const secondaryContactIds: number[] = [];

  // Primary's info goes first
  if (primary.email) emails.push(primary.email);
  if (primary.phoneNumber) phoneNumbers.push(primary.phoneNumber);

  // Then secondaries
  for (const contact of allContacts.slice(1)) {
    if (contact.email && !emails.includes(contact.email)) {
      emails.push(contact.email);
    }
    if (
      contact.phoneNumber &&
      !phoneNumbers.includes(contact.phoneNumber)
    ) {
      phoneNumbers.push(contact.phoneNumber);
    }
    secondaryContactIds.push(contact.id);
  }

  return {
    contact: {
      primaryContatctId: primaryId,
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  };
}
