const db = require('./config/db');

async function checkTeacherAccount() {
try {
const [rows] = await db.execute(
'SELECT DATABASE() AS databaseName, id, email FROM users WHERE email = ?',
['[testuser@example.com](mailto:testuser@example.com)']
);


    console.log('Connected database:', rows.length ? rows[0].databaseName : 'No matching account');
    console.log('Matching accounts:', rows);

    if (rows.length === 0) {
        console.log('The account was not found in the connected database.');
    } else {
        console.log('Teacher account found successfully!');
    }
} catch (error) {
    console.error('Database check failed:', error.message);
} finally {
    await db.end();
}


}

checkTeacherAccount();
