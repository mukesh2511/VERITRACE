import pool from '../../config/db';

export class DatabaseService {
  static async executeQuery(query, params = []) {
    try {
      const [rows] = await pool.execute(query, params);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Database query error:', error);
      return { success: false, error: error.message };
    }
  }

  static async executeTransaction(queries) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results = [];
      
      for (const { query, params } of queries) {
        const [result] = await connection.execute(query, params);
        results.push(result);
      }
      
      await connection.commit();
      return { success: true, data: results };
      
    } catch (error) {
      await connection.rollback();
      console.error('Transaction error:', error);
      return { success: false, error: error.message };
      
    } finally {
      connection.release();
    }
  }

  static async checkExists(table, field, value, excludeId = null) {
    let query = `SELECT COUNT(*) as count FROM ${table} WHERE ${field} = ?`;
    let params = [value];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const result = await this.executeQuery(query, params);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    return { success: true, exists: result.data[0].count > 0 };
  }

  static async getWithJoins(mainTable, joins, where = {}, orderBy = null) {
    let query = `SELECT ${mainTable}.*`;
    const params = [];
    
    // Add JOIN clauses
    for (const join of joins) {
      query += `, ${join.select}`;
      query += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
    }
    
    query += ` FROM ${mainTable}`;
    
    // Add JOIN tables to FROM clause
    for (const join of joins) {
      query += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
    }
    
    // Add WHERE conditions
    if (Object.keys(where).length > 0) {
      query += ' WHERE ';
      const conditions = [];
      
      for (const [key, value] of Object.entries(where)) {
        if (Array.isArray(value)) {
          conditions.push(`${key} IN (${value.map(() => '?').join(',')})`);
          params.push(...value);
        } else if (typeof value === 'object' && value.like) {
          conditions.push(`${key} LIKE ?`);
          params.push(`%${value.like}%`);
        } else {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
      }
      
      query += conditions.join(' AND ');
    }
    
    // Add ORDER BY
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    return this.executeQuery(query, params);
  }

  static async getPaginated(table, page = 1, limit = 10, where = {}, orderBy = null) {
    const offset = (page - 1) * limit;
    
    let query = `SELECT * FROM ${table}`;
    const params = [];
    
    // Add WHERE conditions
    if (Object.keys(where).length > 0) {
      query += ' WHERE ';
      const conditions = [];
      
      for (const [key, value] of Object.entries(where)) {
        if (Array.isArray(value)) {
          conditions.push(`${key} IN (${value.map(() => '?').join(',')})`);
          params.push(...value);
        } else if (typeof value === 'object' && value.like) {
          conditions.push(`${key} LIKE ?`);
          params.push(`%${value.like}%`);
        } else {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
      }
      
      query += conditions.join(' AND ');
    }
    
    // Add ORDER BY
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    // Add LIMIT and OFFSET
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM ${table}`;
    const countResult = await this.executeQuery(countQuery);
    
    if (!countResult.success) {
      return countResult;
    }
    
    const total = countResult.data[0].total;
    const totalPages = Math.ceil(total / limit);
    
    // Get paginated data
    const dataResult = await this.executeQuery(query, params);
    
    if (!dataResult.success) {
      return dataResult;
    }
    
    return {
      success: true,
      data: dataResult.data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  static async auditLog(user_id, table_name, record_id, action, old_values = null, new_values = null) {
    const query = `
      INSERT INTO audit_log (user_id, table_name, record_id, action, old_values, new_values)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      user_id,
      table_name,
      record_id,
      action,
      old_values ? JSON.stringify(old_values) : null,
      new_values ? JSON.stringify(new_values) : null
    ];
    
    return this.executeQuery(query, params);
  }

  static async logStatusChange(unit_id, old_status, new_status, changed_by = null) {
    const query = `
      INSERT INTO product_status_history (unit_id, old_status, new_status, changed_by)
      VALUES (?, ?, ?, ?)
    `;
    
    return this.executeQuery(query, [unit_id, old_status, new_status, changed_by]);
  }
}

export default DatabaseService;
