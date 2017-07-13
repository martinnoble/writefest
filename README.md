# writefest

Required python packages:

* flask_script
* flask_migrate
* flask_bcrypt
* loremipsum

All can be intalled with "pip"


Service can be installed on debian by making a symlink from /etc/init.d/writefest to the "writefest" service file in the root of the install.

Then run: "update-rc.d writefest defaults" to install the service

Service can then be controlled, eg:

service writefest <start | stop | restart>
