import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import stream from 'stream';

// Helper function to create a Google Drive client
const createDriveClient = (credentialsJson: string) => {
    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    return google.drive({ version: 'v3', auth });
};

// Helper function to handle the file upload
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
    const requiredVars = [
        'DATABASE_URL',
        'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS',
        'GOOGLE_DRIVE_FOLDER_ID',
    ];
    for (const v of requiredVars) {
        if (!process.env[v]) {
            return NextResponse.json({ error: `Missing required environment variable: ${v}` }, { status: 500 });
        }
    }

    try {
        console.log('Starting database backup using pg-dump package...');

        // 1. Dynamically import the pg-dump package
        // This resolves the Next.js build issue.
        const { default: pgDump } = await import('pg-dump');

        // 2. Create the Google Drive client
        const driveClient = createDriveClient(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS!);
        
        // 3. Create the backup stream using the library
        const dumpStream = new stream.PassThrough();
        const dump = new pgDump({ connectionString: process.env.DATABASE_URL! });
        
        // Handle potential errors from the dump process itself
        dump.on('error', (err: any) => {
            console.error('Error from pg-dump:', err);
            // Close the stream on error to prevent hanging
            dumpStream.end();
        });

        dump.dump(dumpStream);
        
        // 4. Start the upload
        const date = new Date().toISOString().split('T')[0];
        const fileName = `backup-${date}.sql`;

        const result = await uploadToDrive(driveClient, process.env.GOOGLE_DRIVE_FOLDER_ID!, fileName, dumpStream);

        console.log('Upload completed successfully.');
        return NextResponse.json({
            success: true,
            result: {
                drive: 1,
                fileId: result.data.id,
            },
        });

    } catch (error: any) {
        console.error('Backup failed:', error);
        return NextResponse.json({ error: 'Backup failed.', details: error.message }, { status: 500 });
    }
}

export const maxDuration = 300; // 5 minutes