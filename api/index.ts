export interface Env {
  DB: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 获取所有记录
      if (path === '/api/records' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM records ORDER BY created_at DESC'
        ).all();
        
        // 转换数据格式
        const transformedRecords = results.map((row: any) => ({
          id: row.id,
          date: row.date,
          author: row.author,
          module: row.module,
          reason: row.reason,
          content: row.content,
          photos: row.photos ? JSON.parse(row.photos) : [],
          testResult: row.test_result || '',
          problems: row.problems || '',
          nextSteps: row.next_steps || '',
          createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
          updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
        }));
        
        return new Response(JSON.stringify(transformedRecords), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 创建记录
      if (path === '/api/records' && request.method === 'POST') {
        const body = await request.json();
        const id = crypto.randomUUID();
        const now = Date.now();
        
        await env.DB.prepare(`
          INSERT INTO records (id, date, author, module, reason, content, photos, test_result, problems, next_steps, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          body.date,
          body.author,
          body.module,
          body.reason,
          body.content,
          JSON.stringify(body.photos || []),
          body.testResult || '',
          body.problems || '',
          body.nextSteps || '',
          now,
          now
        ).run();

        const newRecord = {
          id,
          ...body,
          createdAt: now,
          updatedAt: now,
        };

        return new Response(JSON.stringify(newRecord), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 获取单条记录
      if (path.startsWith('/api/records/') && request.method === 'GET') {
        const id = path.split('/').pop();
        const { results } = await env.DB.prepare(
          'SELECT * FROM records WHERE id = ?'
        ).bind(id).all();
        
        if (results.length === 0) {
          return new Response(JSON.stringify({ error: '记录不存在' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const row = results[0] as any;
        const record = {
          id: row.id,
          date: row.date,
          author: row.author,
          module: row.module,
          reason: row.reason,
          content: row.content,
          photos: row.photos ? JSON.parse(row.photos) : [],
          testResult: row.test_result || '',
          problems: row.problems || '',
          nextSteps: row.next_steps || '',
          createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
          updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
        };
        
        return new Response(JSON.stringify(record), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 更新记录
      if (path.startsWith('/api/records/') && request.method === 'PUT') {
        const id = path.split('/').pop();
        const body = await request.json();
        const now = Date.now();
        
        await env.DB.prepare(`
          UPDATE records SET
            date = ?,
            author = ?,
            module = ?,
            reason = ?,
            content = ?,
            photos = ?,
            test_result = ?,
            problems = ?,
            next_steps = ?,
            updated_at = ?
          WHERE id = ?
        `).bind(
          body.date,
          body.author,
          body.module,
          body.reason,
          body.content,
          JSON.stringify(body.photos || []),
          body.testResult || '',
          body.problems || '',
          body.nextSteps || '',
          now,
          id
        ).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 删除记录
      if (path.startsWith('/api/records/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        await env.DB.prepare('DELETE FROM records WHERE id = ?').bind(id).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: '未找到API接口' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message || '服务器错误' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
