
# ProtoForge

**Environment Variables**\
A number of environment variables are expected to be set (either locally, in a _.env_ file, or on the cloud PaaS used for deployment) before running the app. The specific variables needed depends on the app specifications. The following is a list of all variables that are possibly used.

_DEV_EMAIL_ADDRESSES_\
One or more email addresses, separated by commas, that identify developer user accounts.

_DATABASE_URL_\
Connection URL (or string) to the database, needed in all cases. It's exact format depends on the database engine used. In general, special characters in passwords needs to be url-encoded.

_OBJECT_STORAGE_PROVIDER_\
The object storage service used, if any. Possible values are: "digital-ocean-spaces", "aws-s3", and "wasabi".

_OBJECT_STORAGE_ACCESS_KEY_ID_\
Key id of provider account used to access objects, if using object storage services (e.g., Digital Ocean Spaces, AWS S3, etc)

_OBJECT_STORAGE_ACCESS_KEY_SECRET_\
Secret key of provider account used to acccess objects, if using object storage services.

_OBJECT_STORAGE_REGION_\
Default region from which to access objects, if using object storage services.

_OBJECT_STORAGE_DEFAULT_BUCKET_\
Default bucket from which to access objects, if using object storage services..

_CDN_ROOT_URL_\
If a CDN is used, this variable specifies it's root URL. For example, if using AWS Cloudfront, this would be the Cloudfront root URL..

_SMTP_HOST_\
SMTP server used to send email (e.g., mail.domain.com); always required..

_SMTP_PORT_\
Port used by SMTP server to send email; always required..

_SMTP_USERNAME_\
Username for account used to send email from STMP server; always required..

_SMTP_PASSWORD_\
Password for account used to send email from STMP server; always required..

_PORT_\
The port that the app should listen on.

_NODE_ENV_\
Indicates whether the app should run in a production or development context. The valid values are _prod_ and _dev_, respectively. .

