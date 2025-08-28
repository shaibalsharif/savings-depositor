// lib/actions/util/generateInfoPdf.tsx
"use server";

import { db } from "@/lib/db";
import { users, personalInfo, nomineeInfo, terms } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import path from "path";
import fs from "fs";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";

// Helper to handle null/empty values
const formatDisplayValue = (value: any): string => {
  return value ? value.toSTring() : '----------';
};

// Helper to safely format date values
const formatDateValue = (date: any): string => {
  if (date ) {
    return date.toString().split('T')[0];
  }
  return '----------';
};

export async function generateUserInfoPdf(userId: string) {
  const { getPermissions } = getKindeServerSession();
  const permissions = await getPermissions();

  if (!permissions?.permissions?.includes("admin")) {
    return { error: "Unauthorized access" };
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [info] = await db.select().from(personalInfo).where(eq(personalInfo.userId, userId));
    const [nominee] = await db.select().from(nomineeInfo).where(eq(nomineeInfo.userId, userId));
    const [latestTerms] = await db.select().from(terms).orderBy(desc(terms.createdAt)).limit(1);

    if (!user) {
      return { error: "User not found" };
    }

    const htmlTemplatePath = path.join(process.cwd(), 'lib/actions/util/pdf_template.html');
    const templateSource = fs.readFileSync(htmlTemplatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    // Read font files and encode them as Base64 Data URIs
    const helveticaFontData = fs.readFileSync(path.join(process.cwd(), 'lib/fonts/Helvetica.ttf')).toString('base64');
    const helveticaBoldFontData = fs.readFileSync(path.join(process.cwd(), 'lib/fonts/Helvetica-Bold.ttf')).toString('base64');
    const kalpurushFontData = fs.readFileSync(path.join(process.cwd(), 'lib/fonts/Kalpurush.ttf')).toString('base64');

    const data = {
      user: {
        ...user,
        
      },
      info: {
        ...info,
        dob: formatDateValue(info?.dob),
      },
      nominee: {
        ...nominee,
        dob: formatDateValue(nominee?.dob),
      },
      termsContent: latestTerms?.content || 'নিয়মাবলী পাওয়া যায়নি।',
      // Pass font data and image URLs to the template
      fonts: {
        kalpurush: `data:font/ttf;base64,${kalpurushFontData}`,
        helvetica: `data:font/ttf;base64,${helveticaFontData}`,
        helveticaBold: `data:font/ttf;base64,${helveticaBoldFontData}`,
      },
      images: {
        logoUrl: 'https://t4.ftcdn.net/jpg/02/90/27/39/360_F_290273933_ukYZjDv8nqgpOBcBUo5CQyFcxAzYlZRW.jpg',
        profileImageUrl: 'https://t4.ftcdn.net/jpg/02/90/27/39/360_F_290273933_ukYZjDv8nqgpOBcBUo5CQyFcxAzYlZRW.jpg',
        nomineeImageUrl: 'https://media.istockphoto.com/id/615279718/photo/businesswoman-portrait-on-white.jpg?s=612x612&w=0&k=20&c=Aa2Vy4faAPe9fAE68Z01jej9YqPqy-RbAteIlF3wcjk=',
      },
    };


    console.log(data.user)
    console.log(data.info)
    console.log(data.nominee)
    console.log(data.termsContent)

    const htmlContent = template(data);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
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