import { describe, expect, it } from "vitest";
import { assertSafeMcpUrl, isPrivateIp } from "@/lib/mcp/urlGuard";

describe("isPrivateIp", () => {
  it("blocks private and reserved IPv4 ranges", () => {
    for (const ip of [
      "10.0.0.1",
      "127.0.0.1",
      "169.254.169.254",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "100.64.0.1",
      "0.0.0.0",
      "224.0.0.1",
      "192.0.0.170",
      "198.18.0.1",
    ]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
  });

  it("allows public IPv4", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "142.250.72.14", "172.32.0.1", "100.128.0.1"]) {
      expect(isPrivateIp(ip), ip).toBe(false);
    }
  });

  it("handles IPv6", () => {
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("::")).toBe(true);
    expect(isPrivateIp("fc00::1")).toBe(true);
    expect(isPrivateIp("fd12:3456::1")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
    expect(isPrivateIp("::ffff:192.168.0.1")).toBe(true);
    expect(isPrivateIp("::ffff:8.8.8.8")).toBe(false);
    expect(isPrivateIp("2606:4700:4700::1111")).toBe(false);
  });

  it("treats malformed input as unsafe", () => {
    expect(isPrivateIp("not-an-ip")).toBe(true);
  });
});

describe("assertSafeMcpUrl", () => {
  it("rejects non-https and credentialed URLs", async () => {
    await expect(assertSafeMcpUrl("ftp://example.com")).rejects.toThrow(/https/);
    await expect(assertSafeMcpUrl("http://example.com/mcp")).rejects.toThrow(/https/);
    await expect(assertSafeMcpUrl("https://user:pass@example.com/mcp")).rejects.toThrow(/Credentials/);
    await expect(assertSafeMcpUrl("garbage")).rejects.toThrow(/Invalid URL/);
  });

  it("rejects private IP literals without DNS", async () => {
    await expect(assertSafeMcpUrl("https://169.254.169.254/latest")).rejects.toThrow(/not reachable/);
    await expect(assertSafeMcpUrl("https://10.1.2.3/mcp")).rejects.toThrow(/not reachable/);
  });

  it("accepts public IP literals without DNS", async () => {
    await expect(assertSafeMcpUrl("https://1.1.1.1/mcp")).resolves.toBeInstanceOf(URL);
  });
});
