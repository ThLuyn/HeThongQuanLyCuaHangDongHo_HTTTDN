import bcrypt from 'bcrypt';

async function main() {
    // const password = 'AdminGTime';
    // const password = 'NVGTime02';
    // const password = 'NVGTime03';
    const password = 'NVGTime04';
    const hash = await bcrypt.hash(password, 12);
    console.log(hash);
}

main();