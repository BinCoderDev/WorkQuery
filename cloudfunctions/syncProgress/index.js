const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, bankId, mode, currentIndex, completedCount } = event
  const openid = cloud.getWXContext().OPENID

  if (!openid) return { code: -1, message: '用户未登录' }

  try {
    switch (action) {
      case 'save': {
        // Upsert：按 _openid + bankId 唯一
        const { data: existing } = await db.collection('user_progress')
          .where({ _openid: openid, bankId })
          .limit(1).get()

        const record = {
          bankId,
          mode: mode || 'sequential',
          currentIndex: currentIndex || 0,
          completedCount: completedCount || 0,
          updatedAt: Date.now()
        }

        if (existing.length > 0) {
          await db.collection('user_progress')
            .doc(existing[0]._id)
            .update({ data: record })
        } else {
          await db.collection('user_progress').add({
            data: { _openid: openid, ...record }
          })
        }
        return { code: 0 }
      }

      case 'get': {
        const { data } = await db.collection('user_progress')
          .where({ _openid: openid })
          .get()

        // 转换为 { [bankId]: progress } 格式
        const progressMap = {}
        for (const item of data) {
          progressMap[item.bankId] = {
            mode: item.mode,
            currentIndex: item.currentIndex,
            completedCount: item.completedCount,
            updatedAt: item.updatedAt
          }
        }
        return { code: 0, data: progressMap }
      }

      default:
        return { code: -1, message: `未知 action: ${action}` }
    }
  } catch (e) {
    console.error('syncProgress error:', e)
    return { code: -1, message: e.message }
  }
}
