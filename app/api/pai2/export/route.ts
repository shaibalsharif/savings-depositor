/**
 * PAI2 Export API Route
 *
 * POST /api/pai2/export — Export chat(s) as downloadable report
 */

import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db/client";
import { chatConversations, chatMessages } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const { isAuthenticated, getUser } = getKindeServerSession();
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const body = await req.json();
    const { chatIds, formatType = "txt" } = body;

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return NextResponse.json(
        { error: "chatIds array is required" },
        { status: 400 }
      );
    }

    // Verify ownership and fetch data
    const conversations = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          inArray(chatConversations.chatId, chatIds),
          eq(chatConversations.userId, user.id)
        )
      );

    if (conversations.length === 0) {
      return NextResponse.json(
        { error: "No conversations found" },
        { status: 404 }
      );
    }

    const allMessages = await db
      .select()
      .from(chatMessages)
      .where(inArray(chatMessages.chatId, conversations.map((c) => c.chatId)))
      .orderBy(chatMessages.createdAt);

    const messagesByChat = new Map<string, typeof allMessages>();
    for (const msg of allMessages) {
      if (!messagesByChat.has(msg.chatId)) {
        messagesByChat.set(msg.chatId, []);
      }
      messagesByChat.get(msg.chatId)!.push(msg);
    }

    if (formatType === "csv") {
      // CSV format
      const lines: string[] = [
        "Chat Title,Message Role,Content,Input Type,Timestamp",
      ];

      for (const conv of conversations) {
        const msgs = messagesByChat.get(conv.chatId) || [];
        for (const msg of msgs) {
          const content = msg.content.replace(/"/g, '""').replace(/\n/g, " ");
          lines.push(
            `"${conv.title}","${msg.role}","${content}","${msg.inputType}","${format(new Date(msg.createdAt), "yyyy-MM-dd HH:mm:ss")}"`
          );
        }
      }

      return new Response(lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="pai2-export-${format(new Date(), "yyyy-MM-dd")}.csv"`,
        },
      });
    }

    if (formatType === "md") {
      const formatMessageContent = (content: string) => {
        const lines = content.split('\n');
        const result = [];
        let inCodeBlock = false;
        let codeType = '';
        let codeContent = '';
      
        for (const line of lines) {
          if (line.startsWith('```')) {
            if (inCodeBlock) {
              if (codeType === 'chart') {
                try {
                  const data = JSON.parse(codeContent.trim());
                  result.push(`**${data.title || 'Chart Data'}**\n`);
                  if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                    result.push(`| Label | Value |`);
                    result.push(`|---|---|`);
                    for (const d of data.data) {
                      result.push(`| ${d.label} | ${d.value} |`);
                    }
                  }
                } catch {
                  result.push(`\`\`\`chart\n${codeContent}\n\`\`\``);
                }
              } else if (codeType === 'download') {
                try {
                  const data = JSON.parse(codeContent.trim());
                  result.push(`**Data Export: ${data.filename || 'export.csv'}**\n`);
                  if (data.headers && data.rows) {
                    result.push(`| ${data.headers.join(' | ')} |`);
                    result.push(`| ${data.headers.map(() => '---').join(' | ')} |`);
                    for (const r of data.rows) {
                      result.push(`| ${r.join(' | ')} |`);
                    }
                  }
                } catch {
                  result.push(`\`\`\`download\n${codeContent}\n\`\`\``);
                }
              } else {
                result.push(`\`\`\`${codeType}\n${codeContent.trim()}\n\`\`\``);
              }
              inCodeBlock = false;
              codeType = '';
              codeContent = '';
            } else {
              inCodeBlock = true;
              codeType = line.slice(3).trim();
            }
            continue;
          }
      
          if (inCodeBlock) {
            codeContent += line + '\n';
          } else {
            result.push(line);
          }
        }
        return result.join('\n');
      };

      const parts: string[] = [];
      for (const conv of conversations) {
        parts.push(`# ${conv.title}`);
        parts.push(`> Provider: ${conv.provider} | Model: ${conv.model} | Created: ${format(new Date(conv.createdAt), "yyyy-MM-dd HH:mm:ss")}\n`);
        
        const msgs = messagesByChat.get(conv.chatId) || [];
        for (const msg of msgs) {
          if (msg.role === "system") continue;
          const prefix = msg.role === "user" ? "**👤 You**" : "**🤖 PAI2**";
          parts.push(`### ${prefix} _[${format(new Date(msg.createdAt), "HH:mm:ss")}]_`);
          parts.push(`${formatMessageContent(msg.content)}\n`);
          parts.push(`---\n`);
        }
      }
      return new Response(parts.join("\n"), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="pai2-export-${format(new Date(), "yyyy-MM-dd")}.md"`,
        },
      });
    }

    // Default: Text format
    const parts: string[] = [];
    for (const conv of conversations) {
      parts.push(`${"=".repeat(60)}`);
      parts.push(`Chat: ${conv.title}`);
      parts.push(`Provider: ${conv.provider} | Model: ${conv.model}`);
      parts.push(`Created: ${format(new Date(conv.createdAt), "yyyy-MM-dd HH:mm:ss")}`);
      parts.push(`${"=".repeat(60)}\n`);

      const msgs = messagesByChat.get(conv.chatId) || [];
      for (const msg of msgs) {
        const prefix =
          msg.role === "user" ? "👤 You" : msg.role === "assistant" ? "🤖 PAI2" : "⚙️ System";
        parts.push(`[${format(new Date(msg.createdAt), "HH:mm:ss")}] ${prefix}:`);
        parts.push(msg.content);
        parts.push("");
      }
      parts.push("\n");
    }

    return new Response(parts.join("\n"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="pai2-export-${format(new Date(), "yyyy-MM-dd")}.txt"`,
      },
    });
  } catch (err) {
    console.error("[PAI2 Export Error]", err);
    return NextResponse.json(
      { error: "Failed to export conversations" },
      { status: 500 }
    );
  }
}
