// adminCheck.js
const adminRoles = ['1167161948782219314', '517420345091817484']; // Add your admin role IDs here

function isAdmin(member) {
  return member.roles.cache.some(role => adminRoles.includes(role.id));
}

module.exports = isAdmin;
