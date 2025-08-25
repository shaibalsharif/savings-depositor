import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process'; // Import spawn from child_process
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
    // Check for the primary drive's environment variables.
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
        console.log('Starting database backup to a single drive...');

        // 1. Create a single Google Drive client
        const drive1 = createDriveClient(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS!);

        // 2. Execute the native pg_dump command and get its output as a stream
        const dumpProcess = spawn('pg_dump', [
            '--dbname',
            process.env.DATABASE_URL!,
            '-F', 'c', // Custom format, good for pg_restore
            '-b',      // Include large objects (blobs)
            '-v'       // Verbose logging
        ]);

        const dumpStream = dumpProcess.stdout;

        // Essential: Handle errors from the pg_dump command itself
        dumpProcess.stderr.on('data', (data) => {
            console.error(`pg_dump stderr: ${data}`);
        });

        // 3. Start the upload using the stream from the command
        const date = new Date().toISOString().split('T')[0];
        const fileName = `backup-${date}.sql.backup`; // Use a .backup extension for custom format

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
export const maxDuration = 300; // 5 minutes