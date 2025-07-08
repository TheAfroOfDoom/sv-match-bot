import { authorize } from "./googleAuth.ts"

const main = async () => {
	const auth = await authorize()
}

main()
