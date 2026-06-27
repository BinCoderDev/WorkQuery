const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, questionId, bankId, questionPreview } = event
  const openid = cloud.getWXContext().OPENID

  if (!openid) return { code: -1, message: '用户未登录' }

  try {
    switch (action) {
      case 'add': {
        // Upsert：如已存在则 errorCount+1，否则新增
        const { data: existing } = await db.collection('user_wrong_questions')
          .where({ _openid: openid, questionId })
          .limit(1).get()

        if (existing.length > 0) {
          await db.collection('user_wrong_questions')
            .doc(existing[0]._id)
            .update({
              data: {
                errorCount: _.inc(1),
                updatedAt: Date.now()
              }
            })
        } else {
          await db.collection('user_wrong_questions').add({
            data: { _openid: openid, questionId, bankId, questionPreview: questionPreview || '', errorCount: 1, addedAt: Date.now(), updatedAt: Date.now() }
          })
        }
        return { code: 0 }
      }

      case 'remove': {
        await db.collection('user_wrong_questions')
          .where({ _openid: openid, questionId })
          .remove()
        return { code: 0 }
      }

      case 'list': {
        const { data } = await db.collection('user_wrong_questions')
          .where({ _openid: openid })
          .orderBy('updatedAt', 'desc')
          .get()
        return { code: 0, data }
      }

      case 'clear': {
        const query = { _openid: openid }
        if (event.bankId) query.bankId = event.bankId
        await db.collection('user_wrong_questions').where(query).remove()
        return { code: 0 }
      }

      default:
        return { code: -1, message: `未知 action: ${action}` }
    }
  } catch (e) {
    console.error('syncWrongQuestions error:', e)
    return { code: -1, message: e.message }
  }
}
