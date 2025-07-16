function roleAssign(rating){
    if (rating <= 1199) return '1394107629671940197';
    else if (rating <= 1399) return '1394107576014077994';
    else if (rating <= 1599) return '1394107528966705234';
    else if (rating <= 1899) return '1394107258585088020';
    else if (rating <= 2199) return '1394107187428593774';
    else return '1394107102330486897';
}

module.exports = roleAssign;