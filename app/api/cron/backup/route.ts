import { google } from 'googleapis';
import pgDump from 'pg-dump';
import { NextResponse } from 'next/server';
import stream from 'stream';

// Helper function to create a Google Drive client from credentials
const createDriveClient = (credentialsJson: string) => {
  const credentials = JSON.parse(credentialsJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  return google.drive({ version: 'v3', auth });
};

// Helper function to handle the file upload logic
const uploadToDrive = (driveClient: any, folderId: string, fileName: string, dataStream: stream.Readable) => {
  return driveClient.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: 'application/octet-stream',
      body: dataStream,
    },
  });
};

export async function GET() {
  // --- MODIFIED ---
  // Now only checks for the primary drive's environment variables.
  const requiredVars = [
    'NEON_DATABASE_URL',
    'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS',
    'GOOGLE_DRIVE_FOLDER_ID',
  ];
  for (const v of requiredVars) {
    if (!process.env[v]) {
      return NextResponse.json({ error: `Missing required environment variable: ${v}` }, { status: 500 });
    }
  }

  try {
    console.log('Starting database backup to a single drive...');

    // 1. Create a single Google Drive client
    const drive1 = createDriveClient(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS!);

    // --- REMOVED ---
    // const drive2 = createDriveClient(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_2!);

    // 2. Begin the database dump, which outputs a stream of data
    const dumpStream = new stream.PassThrough();
    const dump = new pgDump({ connectionString: process.env.NEON_DATABASE_URL! });
    dump.dump(dumpStream);

    // --- SIMPLIFIED ---
    // No need to split the stream for a single upload. We use dumpStream directly.

    // 3. Start the upload
    const date = new Date().toISOString().split('T')[0];
    const fileName = `backup-${date}.sql`;

    // --- SIMPLIFIED ---
    // No Promise.all needed, just await the single upload promise.
    const result = await uploadToDrive(drive1, process.env.GOOGLE_DRIVE_FOLDER_ID!, fileName, dumpStream);

    console.log('Upload completed successfully.');
    return NextResponse.json({
      success: true,
      result: {
        drive: 1,
        fileId: result.data.id
      },
    });

  } catch (error: any) {
    console.error('Backup failed:', error);
    return NextResponse.json({ error: 'Backup failed.', details: error.message }, { status: 500 });
  }
}

// Set a longer timeout for the function, as backups can take time.
// This requires a Vercel Pro plan. The Hobby plan is limited to 10-15s.
export const maxDuration = 300; // 5 minutes