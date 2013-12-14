var user = {

    name: "ivan",
    age: 18
};

var jack = Object.create(user);

console.log(jack);
console.log(jack.name);
