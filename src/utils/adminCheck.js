// adminCheck.js
const adminRoles = [
  '1167161948782219314',
  '1167161948782219316',
  '1167161948782219315',
]; // Add your admin role IDs here

function isAdmin(member) {
  return member.roles.cache.some(role => adminRoles.includes(role.id));
}

module.exports = isAdmin;
