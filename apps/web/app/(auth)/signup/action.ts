"use server";

import { createClient } from "../../../lib/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prisma } from "../../../../../packages/database";

const nameRegex = /^[A-Za-z][A-Za-z\s.'-]*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const indianMobileRegex = /^[6-9]\d{9}$/;

const normalizeIndianMobile = (value: string) =>
  value.replace(/\D/g, "").slice(0, 10);

async function validateSignupData(formData: FormData, isFromAdmin: boolean) {
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const firstName = formData.get("firstName")?.toString().trim() ?? "";
  const lastName = formData.get("lastName")?.toString().trim() ?? "";
  const mobileNumber = normalizeIndianMobile(
    formData.get("mobileNumber")?.toString() ?? "",
  );
  const role = formData.get("role")?.toString() ?? "parent";
  const guardianName = formData.get("guardianName")?.toString().trim() ?? "";
  const dob = formData.get("dob")?.toString() ?? "";
  const locationId = formData.get("locationId")?.toString() ?? "";

  if (
    !email ||
    (!password && !isFromAdmin) ||
    !firstName ||
    !lastName ||
    !mobileNumber ||
    (role === "parent" && !guardianName) ||
    !dob ||
    !locationId
  ) {
    return { error: "Please fill in all required fields" };
  }

  if (
    !nameRegex.test(firstName) ||
    !nameRegex.test(lastName) ||
    (role === "parent" && !nameRegex.test(guardianName))
  ) {
    return {
      error:
        "Names can only contain letters, spaces, periods, apostrophes, or hyphens",
    };
  }

  if (!emailRegex.test(email)) {
    return { error: "Please enter a valid email address" };
  }

  if (!indianMobileRegex.test(mobileNumber)) {
    return {
      error:
        "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9",
    };
  }

  const [year, month, day] = dob.split("-").map(Number);
  const birthDate = new Date(year, month - 1, day);
  const minimumAllowedDate = new Date();
  minimumAllowedDate.setFullYear(minimumAllowedDate.getFullYear() - 6);

  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate > minimumAllowedDate ||
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return { error: "Date of birth must be at least 6 years old" };
  }

  return { error: null };
}

export async function signup(formData: FormData, isFromAdmin = false): Promise<{ success: false; error: string } | { success: true; email: string }> {
  const email = formData.get("email")?.toString().trim() ?? "";
  let password = formData.get("password")?.toString() ?? "";
  const firstName = formData.get("firstName")?.toString().trim() ?? "";
  const lastName = formData.get("lastName")?.toString().trim() ?? "";
  const mobileNumber = normalizeIndianMobile(
    formData.get("mobileNumber")?.toString() ?? "",
  );
  const role = formData.get("role")?.toString() ?? "parent";
  const guardianName = formData.get("guardianName")?.toString().trim() ?? "";
  const dob = formData.get("dob")?.toString() ?? "";
  const locationId = formData.get("locationId")?.toString() ?? "";

  const validationResult = await validateSignupData(formData, isFromAdmin);
  if (validationResult.error) {
    return { success: false, error: validationResult.error };
  }

  if (isFromAdmin && !password) {
    password = Math.random().toString(36).slice(-8) + "X1!";
  }

  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  if (!academy) {
    return { success: false, error: "No active academy available" };
  }

  let authData;
  let authError;

  if (isFromAdmin) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          isFromAdmin: true,
          role,
          guardian_name: role === "parent" ? guardianName : undefined,
          first_name: firstName,
          last_name: lastName,
          mobile_number: mobileNumber,
          location_id: locationId,
          dob: dob,
        },
      },
    });
    authData = data;
    authError = error;
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          guardian_name: role === "parent" ? guardianName : undefined,
          first_name: firstName,
          last_name: lastName,
          mobile_number: mobileNumber,
          location_id: locationId,
          dob: dob,
        },
      },
    });
    authData = data;
    authError = error;
  }

  if (authError || !authData?.user) {
    return { success: false, error: authError?.message ?? "Unable to create account" };
  }

  if (!isFromAdmin) {
    return { success: true, email };
  }

  return { success: true, email };
}

export async function getLocations() {
  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  });
  if (!academy) return [];
  return prisma.location.findMany({
    where: { academy_id: academy.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
