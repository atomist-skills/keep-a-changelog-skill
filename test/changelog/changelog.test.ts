/*
 * Copyright © 2020 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Project } from "@atomist/skill/lib/project/project";
import * as fs from "fs-extra";
import * as path from "path";
import * as assert from "power-assert";

import {
	addEntryToChangelog,
	ChangelogEntry,
	changelogToString,
	filterChangelogEntries,
	readChangelog,
	writeChangelog,
} from "../../lib/changelog/changelog";
import { DefaultFileName } from "../../lib/configuration";

describe("changelog", () => {
	const clPath = path.join(process.cwd(), "CHANGELOG.md");
	const buPath = clPath + ".test-backup";
	before(async () => {
		await fs.copyFile(clPath, buPath);
	});

	after(async () => {
		await fs.move(buPath, clPath, { overwrite: true });
	});

	it("should create changelog", async () => {
		const tcl = path.join("test", DefaultFileName);
		const cl = await readChangelog(tcl);
		try {
			assert(cl.title === "Changelog");
			assert(cl.versions.some((v: any) => v.version === "0.0.0"));
		} finally {
			await fs.remove(tcl);
		}
	});

	it("should read changelog", async () => {
		const p = path.join(process.cwd(), DefaultFileName);
		const cl = await readChangelog(p);
		assert(cl.versions.length > 0);
		assert(cl.title === "Changelog");
	}).timeout(10000);

	it("should add entry to changelog", async () => {
		const clp = path.join(process.cwd(), DefaultFileName);
		const p = ({
			id: {
				owner: "atomist",
				repo: "test",
			},
		} as any) as Project;
		const entry: ChangelogEntry = {
			label: "#1",
			title: "This is a test label",
			category: "added",
			url: "https://github.com/atomist/test/issues/1",
			qualifiers: [],
			authors: [
				{ login: "foo", name: "Super Foo", email: "foo@bar.com" },
			],
		};
		const ocl = await readChangelog(clp);
		const cl = addEntryToChangelog(entry, ocl, p);
		assert.equal(
			cl.versions[0].parsed.Added[cl.versions[0].parsed.Added.length - 1],
			"-   This is a test label. [#1](https://github.com/atomist/test/issues/1) by [@foo](https://github.com/foo)",
		);
	});

	it("should convert back to markdown", async () => {
		const clp = path.join(process.cwd(), DefaultFileName);
		const p = ({
			id: {
				owner: "atomist",
				repo: "test",
			},
		} as any) as Project;
		const entry: ChangelogEntry = {
			label: "#1",
			title: "Something useful was added",
			category: "added",
			url: "https://github.com/atomist/test/issues/1",
			qualifiers: [],
		};
		const ocl = await readChangelog(clp);
		const cl = addEntryToChangelog(entry, ocl, p);
		const out = changelogToString(cl);
		// tslint:disable:max-line-length
		assert(
			/- {3}Something useful was added. \[#1\]\(https:\/\/github.com\/atomist\/test\/issues\/1\)/m.test(
				out,
			),
		);
		assert(/\n$/.test(out));
	});

	it("should write changes back to changelog", async () => {
		const clp = path.join(process.cwd(), DefaultFileName);
		const p = ({
			id: {
				owner: "atomist",
				repo: "test",
			},
		} as any) as Project;
		const entry: ChangelogEntry = {
			label: "1",
			title:
				"This is a test label with some really long text and some more bla bla bla. And even some more and more and more.",
			category: "added",
			url: "https://github.com/atomist/test/issues/1",
			qualifiers: ["breaking"],
		};
		const ocl = await readChangelog(clp);
		const cl = addEntryToChangelog(entry, ocl, p);
		return writeChangelog(cl, clp);
	});

	it("should find non-semver release in changelog", async () => {
		const vcl = path.join(__dirname, "vCHANGELOG.md");
		const ocl = await readChangelog(vcl);
		assert(ocl.title === "Changelog");
		assert.deepStrictEqual(
			ocl.description,
			"All notable changes to this project will be documented in this file. " +
				"This\nproject adheres to [Semantic Versioning](http://semver.org/).",
		);
		assert(ocl.versions.length === 4);
		const vs = ocl.versions.map(v => v.version);
		for (const ev of ["0.15.1", "0.15.0", "0.14.0"]) {
			assert(vs.includes(ev));
		}
	});

	describe("filterChangelogEntries", () => {
		it("returns all entries when no changelog", async () => {
			const e = [
				{
					category: "added",
					authors: [{ login: "you" }],
					title: "Something added.",
					label: "#4",
					url: "https://github.com/some/repo/issues/4",
					qualifiers: [],
				},
				{
					category: "removed",
					authors: [{ login: "you" }],
					title: "Something removed.",
					label: "#44",
					url: "https://github.com/some/repo/issues/44",
					qualifiers: ["breaking"],
				},
				{
					category: "fixed",
					authors: [{ login: "you" }],
					title: "Something fixed.",
					label: "abcdef0",
					url:
						"https://github.com/some/repo/commit/abcdef0123456789abcdef",
					qualifiers: [],
				},
			];
			const c = "not/a/real/file";
			const f = await filterChangelogEntries(e, c);
			assert.deepStrictEqual(f, e);
		});

		it("returns all entries when none match", async () => {
			const e = [
				{
					category: "added",
					authors: [{ login: "you" }],
					title: "Something added.",
					label: "#4",
					url: "https://github.com/some/repo/issues/4",
					qualifiers: [],
				},
				{
					category: "removed",
					authors: [{ login: "you" }],
					title: "Something removed.",
					label: "#44",
					url: "https://github.com/some/repo/issues/44",
					qualifiers: ["breaking"],
				},
				{
					category: "fixed",
					authors: [{ login: "you" }],
					title: "Something fixed.",
					label: "abcdef0",
					url:
						"https://github.com/some/repo/commit/abcdef0123456789abcdef",
					qualifiers: [],
				},
			];
			const c = path.join(__dirname, "vCHANGELOG.md");
			const f = await filterChangelogEntries(e, c);
			assert.deepStrictEqual(f, e);
		});

		it("filters out matching entries", async () => {
			const e = [
				{
					category: "added",
					authors: [{ login: "you" }],
					title: "Something added.",
					label: "#4",
					url: "https://github.com/atomist/k8svent/issues/11",
					qualifiers: [],
				},
				{
					category: "removed",
					authors: [{ login: "you" }],
					title: "Something removed.",
					label: "#44",
					url: "https://github.com/atomist/k8svent/issues/44",
					qualifiers: ["breaking"],
				},
				{
					category: "fixed",
					authors: [{ login: "you" }],
					title: "Something fixed.",
					label: "32c1101",
					url:
						"https://github.com/atomist/k8svent/commit/32c11015c603ef90378914f82811ee1489c19991",
					qualifiers: [],
				},
			];
			const c = path.join(__dirname, "vCHANGELOG.md");
			const f = await filterChangelogEntries(e, c);
			const x = [
				{
					category: "removed",
					authors: [{ login: "you" }],
					title: "Something removed.",
					label: "#44",
					url: "https://github.com/atomist/k8svent/issues/44",
					qualifiers: ["breaking"],
				},
			];
			assert.deepStrictEqual(f, x);
		});

		it("retains partial matches", async () => {
			const e = [
				{
					category: "added",
					authors: [{ login: "you" }],
					title: "Something added.",
					label: "#4",
					url: "https://github.com/atomist/k8svent/issues/11",
					qualifiers: [],
				},
				{
					category: "removed",
					authors: [{ login: "you" }],
					title: "Something removed.",
					label: "#1",
					url: "https://github.com/atomist/k8svent/issues/1",
					qualifiers: ["breaking"],
				},
			];
			const c = path.join(__dirname, "vCHANGELOG.md");
			const f = await filterChangelogEntries(e, c);
			const x = [
				{
					category: "removed",
					authors: [{ login: "you" }],
					title: "Something removed.",
					label: "#1",
					url: "https://github.com/atomist/k8svent/issues/1",
					qualifiers: ["breaking"],
				},
			];
			assert.deepStrictEqual(f, x);
		});
	});
});
