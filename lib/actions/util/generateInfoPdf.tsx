"use server";

import { db } from "@/lib/db";
import { users, personalInfo, nomineeInfo, terms } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import path from "path";
import { promises as fs } from "fs";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";

// Helpers
const formatDisplayValue = (value: any): string => (value ? value.toString() : "----------");

const formatDateValue = (date: any): string =>
  date ? date.toString().split("T")[0] : "----------";

export async function generateUserInfoPdf(userId: string) {
  const { getPermissions } = getKindeServerSession();
  const permissions = await getPermissions();

  if (!permissions?.permissions?.includes("admin")) {
    return { error: "Unauthorized access" };
  }

  try {
    // ✅ Fetch user data
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [info] = await db.select().from(personalInfo).where(eq(personalInfo.userId, userId));
    const [nominee] = await db.select().from(nomineeInfo).where(eq(nomineeInfo.userId, userId));
    const [latestTerms] = await db
      .select()
      .from(terms)
      .orderBy(desc(terms.createdAt))
      .limit(1);

    if (!user) return { error: "User not found" };

    // ✅ Read HTML template directly from filesystem
    const htmltemplatePath = path.join(
      process.cwd(),
      "public",
      "assets",
      "templates",
      "pdf_template.html"
    );
    const templateSource = await fs.readFile(htmltemplatePath, "utf-8");
    const template = Handlebars.compile(templateSource);

    // ✅ Fonts as base64
    const fontsDir = path.join(process.cwd(), "lib/fonts");
    const helveticaFontData = (await fs.readFile(path.join(fontsDir, "Helvetica.ttf"))).toString("base64");
    const helveticaBoldFontData = (await fs.readFile(path.join(fontsDir, "Helvetica-Bold.ttf"))).toString("base64");
    const kalpurushFontData = (await fs.readFile(path.join(fontsDir, "Kalpurush.ttf"))).toString("base64");

    // ✅ Images as base64
    const publicDir = path.join(process.cwd(), "public/assets/images");
    const logoBuffer = await fs.readFile(path.join(publicDir, "logo.png"));
    const bgBuffer = await fs.readFile(path.join(publicDir, "pdf-bg.png"));

    const data = {
      user: { ...user },
      info: { ...info, dob: formatDateValue(info?.dob) },
      nominee: { ...nominee, dob: formatDateValue(nominee?.dob) },
      termsContent: latestTerms?.content || "নিয়মাবলী পাওয়া যায়নি।",
      fonts: {
        kalpurush: `data:font/ttf;base64,${kalpurushFontData}`,
        helvetica: `data:font/ttf;base64,${helveticaFontData}`,
        helveticaBold: `data:font/ttf;base64,${helveticaBoldFontData}`,
      },
      images: {
        logoUrl: `data:image/png;base64,${logoBuffer.toString("base64")}`,
        bgUrl: `data:image/png;base64,${bgBuffer.toString("base64")}`,
        profileImageUrl:
          "https://t4.ftcdn.net/jpg/02/90/27/39/360_F_290273933_ukYZjDv8nqgpOBcBUo5CQyFcxAzYlZRW.jpg",
        nomineeImageUrl:
          "https://media.istockphoto.com/id/615279718/photo/businesswoman-portrait-on-white.jpg?s=612x612&w=0&k=20&c=Aa2Vy4faAPe9fAE68Z01jej9YqPqy-RbAteIlF3wcjk=",
      },
    };

    const htmlContent = template(data);

    // ✅ Puppeteer PDF generation
    const browser = await puppeteer.launch({
      headless: true, // works both dev and vercel
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return { error: "Failed to generate PDF" };
  }
}
